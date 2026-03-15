import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../../core/services/finance.service';
import { ProfitabilityReport } from '../../../core/api/model/finance';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profitability-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './profitability-dashboard.component.html'
})
export class ProfitabilityDashboardComponent implements OnInit {
  private financeService = inject(FinanceService);

  report = signal<ProfitabilityReport | null>(null);
  isLoading = signal(false);

  startDate = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  endDate = signal(new Date().toISOString().split('T')[0]);

  ngOnInit() {
    this.loadReport();
  }

  loadReport() {
    this.isLoading.set(true);
    this.financeService.getProfitabilityReport(this.startDate(), this.endDate()).subscribe({
      next: (data: ProfitabilityReport) => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getProfitColor(profit: number): string {
    return profit >= 0 ? 'text-green-600' : 'text-red-600';
  }

  getSuggestion(): string {
    const r = this.report();
    if (!r) return '';

    if (r.netProfit < 0) {
      return 'Tus gastos superan tus ganancias este mes. Considera revisar tus costos operativos o crear promociones agresivas en horas muertas.';
    }

    if (r.profitMarginPercentage < 20) {
      return 'Tu margen es bajo. Podrías mejorar la rentabilidad ajustando el precio de platos con alto COGS o reduciendo desperdicios en cocina.';
    }

    return '¡Buen trabajo! Tu restaurante es rentable. Es un buen momento para reinvertir en marketing o lanzar un nuevo producto premium.';
  }
}
