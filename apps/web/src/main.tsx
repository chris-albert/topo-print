import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { createRouter, createHashHistory, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './index.css';
import 'leaflet/dist/leaflet.css';

const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
ReactDOM.createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
