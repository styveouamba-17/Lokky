# @lokky/web

Site public de Lokky, construit avec Astro en génération statique. Il présente l'application sans
backend ni JavaScript côté navigateur.

```bash
npm run dev --workspace @lokky/web
npm run build --workspace @lokky/web
npm run preview --workspace @lokky/web
```

Les images du site sont stockées dans `apps/web/public`. Le build produit le site statique dans
`apps/web/dist`, prêt à être publié sur un hébergeur de sites statiques.

Le domaine configuré est `https://lokky.akylian.com`. Les pages publiques de partage d'activité
(`/activity/:id`) ne sont pas encore générées par ce site.
