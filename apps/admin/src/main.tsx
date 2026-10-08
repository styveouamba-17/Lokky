import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApiError } from './api/client';
import { queryClient } from './api/queries';
import { router } from './router';

// Session expirée (12 h) ou accès retiré pendant le travail : retour à la connexion.
queryClient.getQueryCache().subscribe((event) => {
  const error =
    event.type === 'updated' && event.action.type === 'error' ? event.action.error : null;
  if (
    error instanceof ApiError &&
    error.status === 401 &&
    router.state.location.pathname !== '/login'
  ) {
    queryClient.clear();
    void router.navigate({ to: '/login' });
  }
});

// L'écran de démarrage du HTML reste affiché pendant la vérification de la session : React
// prend la main avec la bonne page (connexion ou admin), sans écran intermédiaire.
await router.load().catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
