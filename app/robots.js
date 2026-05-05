export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/account/', '/auth/'],
      },
    ],
    sitemap: 'https://ancestors-originalbotanica.vercel.app/sitemap.xml',
  };
}
