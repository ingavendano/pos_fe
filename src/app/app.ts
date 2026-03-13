import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Title } from '@angular/platform-browser';
import { TenantService } from './core/services/tenant.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App {
  title = 'fe';
  private authService = inject(AuthService);
  private router = inject(Router);
  private titleService = inject(Title);
  private tenantService = inject(TenantService);

  constructor() {
    effect(() => {
      const registered = this.authService.domainRegistered();
      const currentUrl = this.router.url;
      
      if (registered === false && !currentUrl.includes('setup')) {
        // Domain not registered, redirect to setup
        this.router.navigate(['/setup']);
      }
    });

    // Update document title based on tenant name
    effect(() => {
      const settings = this.tenantService.settings();
      if (settings && settings.name) {
        this.titleService.setTitle(`POS - ${settings.name}`);
      } else {
        this.titleService.setTitle('SaaS POS');
      }
    });
  }
}
