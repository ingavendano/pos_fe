import { Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { Title } from '@angular/platform-browser';
import { TenantService } from './core/services/tenant.service';
import { ChildrenOutletContexts } from '@angular/router';
import { slideInAnimation } from './core/animations/route-animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  animations: [slideInAnimation],
  template: `
    <div [@routeAnimations]="getRouteAnimationData()">
      <router-outlet></router-outlet>
    </div>
  `
})
export class App {
  title = 'fe';
  private authService = inject(AuthService);
  private router = inject(Router);
  private titleService = inject(Title);
  private tenantService = inject(TenantService);
  private contexts = inject(ChildrenOutletContexts);

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }

  constructor() {
    effect(() => {
      const registered = this.authService.domainRegistered();
      const currentUrl = this.router.url;
      
      if (registered === false && !currentUrl.includes('setup') && !currentUrl.includes('landing')) {
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
