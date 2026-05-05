export const revalidate = 3600;

export default function sitemap() {
  const base = 'https://ancestors-originalbotanica.vercel.app';
  const now = new Date().toISOString();

  const staticRoutes = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/altar`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/light-a-candle`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  return staticRoutes;
}
