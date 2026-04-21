import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.page').then((m) => m.CheckoutPage),
  },
  {
    path: 'order-success/:id',
    loadComponent: () => import('./order-success/order-success.page').then((m) => m.OrderSuccessPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];