import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomainService } from '../../core/services/domain.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home-decision',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center">
      <div class="animate-pulse flex flex-col items-center gap-4">
        <div class="w-12 h-12 bg-indigo-500 rounded-full"></div>
        <div class="text-slate-500 text-sm font-medium tracking-widest uppercase">Cargando...</div>
      </div>
    </div>
  `
})
export class HomeDecisionComponent implements OnInit {
  private domainService = inject(DomainService);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const isBase = this.domainService.isBaseDomain();

    if (isBase) {
      // We are on the landing domain
      this.router.navigate(['/landing'], { replaceUrl: true });
    } else {
      // We are on a tenant subdomain
      // If already authenticated, go to POS, else go to Login
      if (this.authService.isAuthenticated()) {
        this.router.navigate(['/pos'], { replaceUrl: true });
      } else {
        this.router.navigate(['/login'], { replaceUrl: true });
      }
    }
  }
}
