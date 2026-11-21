import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { LoginPage } from './features/auth/login-page/login-page';
import { DashboardPage } from './features/dashboard/dashboard-page/dashboard-page';
import { MenuManagementPage } from './features/admin/menu-management-page/menu-management-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', component: DashboardPage, canActivate: [authGuard] },
  { path: 'admin/menu', component: MenuManagementPage, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: '' }
];
