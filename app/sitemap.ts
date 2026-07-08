import type { MetadataRoute } from 'next';

// Revalidate once per day — prevents sitemap regeneration on every crawler request
// Without this, each Google/Bing crawl invokes a fresh serverless function.
export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://madhutextorium.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://madhutextorium.com/customize',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
