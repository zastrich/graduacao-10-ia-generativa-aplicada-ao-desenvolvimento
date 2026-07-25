import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogsPage } from './pages/AdminLogsPage';

// Root route — renderiza o AppLayout como shell da aplicação
export const rootRoute = createRootRoute({
  component: AppLayout,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

// Rota de chat sem conversa ativa
export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug/chat',
  component: ChatPage,
});

// Rota de chat com conversa ativa (convId = uuid)
export const chatConvRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/$slug/chat/$uuid',
  component: ChatPage,
});

export const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/login',
  component: AdminLoginPage,
});

export const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminDashboard,
});

export const adminLogsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin/logs',
  component: AdminLogsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  chatRoute,
  chatConvRoute,
  adminLoginRoute,
  adminDashboardRoute,
  adminLogsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => null,
});

// Registra o router para inferência de tipos
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
