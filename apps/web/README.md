# @lokky/web

Site public de Lokky, construit avec Astro en génération statique, sans backend.

```bash
npm run dev --workspace @lokky/web
npm run build --workspace @lokky/web
npm run preview --workspace @lokky/web
```

Les images du site sont stockées dans `apps/web/public`. Le build produit le site statique dans
`apps/web/dist`, prêt à être publié sur un hébergeur de sites statiques.

Le domaine est `https://lokky.app` (Vercel, DNS chez Cloudflare). L'ancien domaine
`lokky.akylian.com` est redirigé vers lui, sauf `/.well-known/*` et `/activity/*` qui restent
servis tels quels pour les liens déjà partagés (`vercel.json`). Pages : accueil, `/confidentialite`,
`/conditions`, `/suppression-compte` et la page de secours `/activity/:id`.
