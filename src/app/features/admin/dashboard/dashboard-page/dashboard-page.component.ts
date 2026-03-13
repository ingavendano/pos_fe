import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DashboardService, DashboardSummary } from '../../../../core/services/dashboard.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard-page.component.html'
})
export default class DashboardPageComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);

  summary = signal<DashboardSummary | null>(null);
  isLoading = signal(true);
  private refreshSub?: Subscription;

  ngOnInit() {
    this.loadData(true);
    // Configurar actualización automática cada 15 segundos
    this.refreshSub = interval(15000).subscribe(() => {
      if (!this.isLoading()) {
        this.loadData(false);
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
    }
  }

  loadData(showLoading: boolean = true) {
    if (showLoading) {
      this.isLoading.set(true);
    }
    const req$ = this.dashboardService.getSummary();
    if (req$) {
      req$.subscribe({
        next: (data) => {
          this.summary.set(data);
          if (showLoading) this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load dashboard', err);
          if (showLoading) this.isLoading.set(false);
        }
      });
    } else {
      if (showLoading) this.isLoading.set(false);
    }
  }
}
