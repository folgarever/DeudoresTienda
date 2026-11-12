import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'clientes',
    loadComponent: () => import('./pages/clientes/clientes').then((m) => m.ClientesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'clientes/:id/historial',
    loadComponent: () => import('./pages/historial/historial').then((m) => m.HistorialComponent),
    canActivate: [authGuard],
  },
  {
    path: 'ventas/nueva',
    loadComponent: () => import('./pages/ventas/nueva-venta').then((m) => m.NuevaVentaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'abonos/nuevo',
    loadComponent: () => import('./pages/abonos/nuevo-abono').then((m) => m.NuevoAbonoComponent),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
