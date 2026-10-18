import type { APIRoute } from 'astro';

// Pages à référencer. /activity/:id (page de secours des liens partagés) est volontairement
// absente : elle est en noindex.
const PAGES = ['/', '/confidentialite', '/conditions', '/suppression-compte'];

export const GET: APIRoute = ({ site }) => {
  const urls = PAGES.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join(
    '\n',
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
