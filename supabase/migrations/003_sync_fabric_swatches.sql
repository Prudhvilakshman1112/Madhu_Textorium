-- Triggers to synchronize fabric swatches across all products in the same category.
-- This ensures that when a swatch is added, updated, or deleted on any product,
-- all other products in the same category automatically reflect the change.

-- 1. Function for INSERT trigger
CREATE OR REPLACE FUNCTION sync_fabric_swatches_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_category VARCHAR;
  r_product RECORD;
BEGIN
  -- Prevent trigger recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Get the category of the product for the inserted swatch
  SELECT category INTO v_category FROM products WHERE id = NEW.product_id;

  -- Loop through all other products in the same category
  FOR r_product IN
    SELECT id FROM products WHERE category = v_category AND id != NEW.product_id
  LOOP
    -- Only insert if it doesn't already exist for that product
    IF NOT EXISTS (
      SELECT 1 FROM fabric_swatches 
      WHERE product_id = r_product.id AND name = NEW.name AND image = NEW.image
    ) THEN
      INSERT INTO fabric_swatches (product_id, name, image, is_visible)
      VALUES (r_product.id, NEW.name, NEW.image, NEW.is_visible);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Function for DELETE trigger
CREATE OR REPLACE FUNCTION sync_fabric_swatches_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_category VARCHAR;
BEGIN
  -- Prevent trigger recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;

  -- Get the category of the product for the deleted swatch
  SELECT category INTO v_category FROM products WHERE id = OLD.product_id;

  -- Delete all identical swatches (by name or image) in the same category
  DELETE FROM fabric_swatches
  WHERE (name = OLD.name OR image = OLD.image)
    AND product_id IN (SELECT id FROM products WHERE category = v_category)
    AND id != OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Function for UPDATE trigger
CREATE OR REPLACE FUNCTION sync_fabric_swatches_update()
RETURNS TRIGGER AS $$
DECLARE
  v_category VARCHAR;
BEGIN
  -- Prevent trigger recursion
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Get the category of the product for the updated swatch
  SELECT category INTO v_category FROM products WHERE id = NEW.product_id;

  -- Update all matching swatches (by name or image) in the same category
  UPDATE fabric_swatches
  SET is_visible = NEW.is_visible,
      name = NEW.name,
      image = NEW.image
  WHERE (name = OLD.name OR image = OLD.image)
    AND product_id IN (SELECT id FROM products WHERE category = v_category)
    AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Set up triggers on the fabric_swatches table
DROP TRIGGER IF EXISTS trg_sync_fabric_swatches_insert ON fabric_swatches;
CREATE TRIGGER trg_sync_fabric_swatches_insert
  AFTER INSERT ON fabric_swatches
  FOR EACH ROW
  EXECUTE FUNCTION sync_fabric_swatches_insert();

DROP TRIGGER IF EXISTS trg_sync_fabric_swatches_delete ON fabric_swatches;
CREATE TRIGGER trg_sync_fabric_swatches_delete
  AFTER DELETE ON fabric_swatches
  FOR EACH ROW
  EXECUTE FUNCTION sync_fabric_swatches_delete();

DROP TRIGGER IF EXISTS trg_sync_fabric_swatches_update ON fabric_swatches;
CREATE TRIGGER trg_sync_fabric_swatches_update
  AFTER UPDATE OF name, image, is_visible ON fabric_swatches
  FOR EACH ROW
  EXECUTE FUNCTION sync_fabric_swatches_update();
