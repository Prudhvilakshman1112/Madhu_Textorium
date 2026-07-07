'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { FiX, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { chromaKeyToTransparent } from '@/utils/chromaKey';
import type { FabricSwatch } from '@/components/ProductModal/ProductModal';
import styles from './FabricLightbox.module.css';

interface Props {
  fabric: FabricSwatch;
  sketchImage: string | undefined;
  garmentName: string;
  onClose: () => void;
}

export default function FabricLightbox({ fabric, sketchImage, garmentName, onClose }: Props) {
  const [sketchOn, setSketchOn]               = useState(false);

  /**
   * processedSketch — holds the chroma-keyed transparent PNG data URL.
   * null   = not yet processed
   * ''     = processing failed / no sketchImage
   * string = ready data URL
   */
  const [processedSketch, setProcessedSketch] = useState<string | null>(null);
  const [processing, setProcessing]           = useState(false);

  /* Stable per-mount cache-buster so the browser always fetches the latest file */
  const cacheBust = useMemo(() => Date.now(), []);

  /* When the user activates the overlay for the first time, run chroma-key */
  useEffect(() => {
    if (!sketchOn || !sketchImage) return;
    if (processedSketch !== null) return;  // already processed

    setProcessing(true);

    const url = `${sketchImage}?v=${cacheBust}`;
    chromaKeyToTransparent(url, {
      keyColor:  { r: 255, g: 0, b: 255 }, // magenta → transparent
      tolerance: 60,
      softEdge:  20,
    })
      .then(dataUrl => {
        setProcessedSketch(dataUrl);
        setProcessing(false);
      })
      .catch(err => {
        console.error('[FabricLightbox] chromaKey failed:', err);
        // Fallback: use the raw image directly (no chroma-key)
        setProcessedSketch(url);
        setProcessing(false);
      });
  }, [sketchOn, sketchImage, processedSketch, cacheBust]);

  /* Close on Escape */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [handleKey]);

  return (
    <>
      {/* Dark backdrop — z above the product modal */}
      <div className={styles.backdrop} onClick={onClose} />

      <div className={styles.lightbox} role="dialog" aria-modal="true"
           aria-label={`${fabric.name} fabric preview`}>

        {/* ── Top bar ── */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            <span className={styles.fabricName}>{fabric.name}</span>
            <span className={styles.garmentLabel}>on {garmentName}</span>
          </div>

          <div className={styles.topRight}>
            {sketchImage && (
              <button
                className={`${styles.eyeBtn} ${sketchOn ? styles.eyeBtnActive : ''}`}
                onClick={() => setSketchOn(v => !v)}
                disabled={processing}
                aria-label={sketchOn ? 'Hide garment preview' : 'See garment on this fabric'}
              >
                {processing
                  ? <FiLoader size={18} className={styles.spinner} />
                  : sketchOn
                    ? <FiEyeOff size={18} />
                    : <FiEye size={18} />
                }
                {processing ? 'Processing…' : sketchOn ? 'Hide Preview' : 'Try On Garment'}
              </button>
            )}

            <button className={styles.closeBtn} onClick={onClose} aria-label="Close preview">
              <FiX size={22} />
            </button>
          </div>
        </div>

        {/* ── Main canvas ── */}
        <div className={styles.canvas}>

          {/* Layer 1: fabric fills background */}
          <div className={styles.fabricLayer}>
            <Image
              src={fabric.image}
              alt={fabric.name}
              fill
              priority
              unoptimized
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>

          {/*
            Layer 2: chroma-keyed sketch overlay.
            The chromaKeyToTransparent() function already converted
            magenta → transparent pixels in a Canvas, and returned a
            data URL PNG with real alpha. We just stack it on top with
            a plain <img>. No blend modes, no filters — the transparent
            holes in the PNG reveal the fabric behind exactly as-is.
          */}
          {sketchOn && processedSketch && (
            <div className={styles.sketchLayer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={processedSketch}
                alt={`${garmentName} garment outline`}
                className={styles.sketchImg}
              />
            </div>
          )}

          {/* Spinner while chroma-key is processing */}
          {sketchOn && processing && (
            <div className={styles.processingOverlay}>
              <FiLoader size={32} className={styles.spinner} />
              <span>Preparing garment preview…</span>
            </div>
          )}

          {/* Hint shown before first Try-On click */}
          {!sketchOn && sketchImage && (
            <div className={styles.hint}>
              <FiEye size={16} />
              Tap &quot;Try On Garment&quot; to see this fabric stitched
            </div>
          )}
        </div>

        {/* ── Bottom label ── */}
        <div className={styles.bottomBar}>
          <span className={styles.bottomNote}>
            {sketchOn && processedSketch
              ? `The transparent garment area shows this ${fabric.name} fabric — everything else is the figure's natural look.`
              : 'This is the raw fabric texture. Toggle "Try On" to preview it as a garment.'}
          </span>
        </div>
      </div>
    </>
  );
}
