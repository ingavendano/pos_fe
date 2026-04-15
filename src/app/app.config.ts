import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';
import { LucideAngularModule, Plus, Trash2, Filter, Receipt, TrendingUp, TrendingDown, DollarSign, PieChart, Info, Search, ChevronRight, LayoutDashboard, Utensils, Users, BarChart3, Settings, LogOut, Package, ShoppingCart } from 'lucide-angular';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      Plus, Trash2, Filter, Receipt, TrendingUp, TrendingDown, DollarSign, PieChart, Info,
      Search, ChevronRight, LayoutDashboard, Utensils, Users, BarChart3, Settings, LogOut,
      Package, ShoppingCart
    })),
    provideServiceWorker('ngsw-worker.js', {
      // Only enable in production to avoid DevTools conflicts
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
