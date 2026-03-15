import {
    Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, SalesReport } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';

import { ProfitabilityDashboardComponent } from '../profitability-dashboard/profitability-dashboard.component';

@Component({
    selector: 'app-reports-page',
    standalone: true,
    imports: [CommonModule, FormsModule, DecimalPipe, ProfitabilityDashboardComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './reports-page.component.html',
})
export class ReportsPageComponent implements OnInit {
    private reportService = inject(ReportService);
    private authService = inject(AuthService);
    private tenantService = inject(TenantService);

    selectedTab = signal<'sales' | 'profitability'>('sales');

    report = signal<SalesReport | null>(null);
    loading = signal(false);
    error = signal<string | null>(null);

    fromDate = signal(this.firstDayOfCurrentMonth());
    toDate = signal(this.today());

    /** Currency symbol from tenant settings (e.g. 'Q', '$', '€') */
    currencySymbol = computed(() => this.tenantService.settings()?.currencySymbol ?? 'Q');

    // Chart data
    maxDailyRevenue = computed(() => {
        const sales = this.report()?.dailySales ?? [];
        return Math.max(...sales.map(d => d.revenue), 1);
    });

    maxProductQty = computed(() => {
        const products = this.report()?.topProducts ?? [];
        return Math.max(...products.map(p => p.quantitySold), 1);
    });

    ngOnInit(): void {
        this.fetchReport();
    }

    fetchReport(): void {
        this.loading.set(true);
        this.error.set(null);
        this.reportService.getSalesReport(this.fromDate(), this.toDate()).subscribe({
            next: data => {
                this.report.set(data);
                this.loading.set(false);
            },
            error: err => {
                this.error.set('Error al cargar el reporte. Verifica las fechas.');
                this.loading.set(false);
            }
        });
    }

    onDateChange(field: 'from' | 'to', value: string): void {
        if (field === 'from') this.fromDate.set(value);
        else this.toDate.set(value);
    }

    barWidth(value: number, max: number): number {
        return max > 0 ? Math.round((value / max) * 100) : 0;
    }

    paymentMethodIcon(method: string): string {
        const icons: Record<string, string> = {
            CASH: '💵', CARD: '💳', TRANSFER: '🏦'
        };
        return icons[method] ?? '💱';
    }

    paymentMethodLabel(method: string): string {
        const labels: Record<string, string> = {
            CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia'
        };
        return labels[method] ?? method;
    }

    private firstDayOfCurrentMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    }

    private today(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
}
