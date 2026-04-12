import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { setupGuard } from './core/guards/setup.guard';

export const routes: Routes = [
    {
        path: 'setup',
        loadComponent: () => import('./features/setup/setup').then(m => m.SetupComponent),
        canActivate: [setupGuard] // Will allow access if setup == false, else will redirect to login/pos
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [setupGuard]
    },
    {
        path: '',
        loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        canActivate: [setupGuard, authGuard],
        children: [
            { path: '', redirectTo: 'pos', pathMatch: 'full' },
            { path: 'pos', loadComponent: () => import('./features/pos/pos-page/pos-page.component').then(m => m.PosPageComponent), data: { permission: 'POS', animation: 'PosPage' } },
            { path: 'invoices', loadComponent: () => import('./features/invoices/invoices-page/invoices-page.component'), data: { permission: 'INVOICES', animation: 'InvoicesPage' } },
            {
                path: 'catalog',
                children: [
                    { path: 'categories', loadComponent: () => import('./features/catalog/categories-page/categories-page.component'), data: { permission: 'CATEGORIES' } },
                    { path: 'products', loadComponent: () => import('./features/catalog/products-page/products-page.component'), data: { permission: 'PRODUCTS' } }
                ]
            },
            {
                path: 'admin',
                children: [
                    {
                        path: 'dashboard',
                        loadComponent: () => import('./features/admin/dashboard/dashboard-page/dashboard-page.component'),
                        data: { permission: 'REPORTS', animation: 'DashboardPage' }
                    },
                    {
                        path: 'branches',
                        loadComponent: () => import('./features/admin/branches-page/branches-page.component'),
                        data: { permission: 'BRANCHES' }
                    },
                    {
                        path: 'tables',
                        loadComponent: () => import('./features/admin/tables-page/tables-page.component'),
                        data: { permission: 'TABLES', animation: 'TablesPage' }
                    },
                    {
                        path: 'users',
                        loadComponent: () => import('./features/admin/users-page/users-page.component'),
                        data: { permission: 'USERS' }
                    },
                    {
                        path: 'taxes',
                        loadComponent: () => import('./features/admin/taxes-page/taxes-page.component'),
                        data: { permission: 'TAXES' }
                    },
                    {
                        path: 'expenses',
                        loadComponent: () => import('./features/admin/expenses-page/expenses-page.component').then(m => m.ExpensesPageComponent),
                        data: { permission: 'REPORTS' }
                    },
                    {
                        path: 'roles',
                        loadComponent: () => import('./features/admin/roles-page/roles-page.component').then(m => m.RolesPageComponent),
                        data: { permission: 'ROLES' }
                    },
                    {
                        path: 'reports',
                        loadComponent: () => import('./features/admin/reports-page/reports-page.component').then(m => m.ReportsPageComponent),
                        data: { permission: 'REPORTS' }
                    },
                    {
                        path: 'customers',
                        loadComponent: () => import('./features/admin/customers-page/customers-page.component').then(m => m.CustomersPageComponent),
                        data: { permission: 'CUSTOMERS' }
                    },
                    {
                        path: 'cash-register',
                        loadComponent: () => import('./features/admin/cash-register-page/cash-register-page.component').then(m => m.CashRegisterPageComponent),
                        data: { permission: 'SETTINGS' }
                    },
                    {
                        path: 'inventory',
                        loadComponent: () => import('./features/admin/inventory-page/inventory-page.component').then(m => m.InventoryPageComponent),
                        data: { permission: 'INVENTORY' }
                    },
                    {
                        path: 'settings',
                        loadComponent: () => import('./features/admin/tenant-settings-page/tenant-settings-page.component'),
                        data: { permission: 'SETTINGS', animation: 'SettingsPage' }
                    },
                    {
                        path: 'subscription-plans',
                        loadComponent: () => import('./features/admin/subscription-plans/subscription-plans.component').then(m => m.SubscriptionPlansComponent),
                        data: { permission: 'SETTINGS' }
                    }
                ]
            }
        ]
    },
    {
        // Kitchen Display — fullscreen, no sidebar layout
        path: 'kitchen',
        loadComponent: () => import('./features/kitchen/kitchen-display/kitchen-display.component').then(m => m.KitchenDisplayComponent),
        canActivate: [setupGuard, authGuard],
        data: { permission: 'KITCHEN' }
    },
    { path: '**', redirectTo: 'pos' }
];
