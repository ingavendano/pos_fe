import {
    Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashRegisterService, CashRegisterResponse } from '../../../core/services/cash-register.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
    selector: 'app-cash-register-page',
    standalone: true,
    imports: [CommonModule, FormsModule, DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './cash-register-page.component.html',
})
export class CashRegisterPageComponent implements OnInit {
    private cashRegisterService = inject(CashRegisterService);
    private authService = inject(AuthService);
    private tenantService = inject(TenantService);

    currencySymbol = computed(() => this.tenantService.settings()?.currencySymbol ?? 'Q');

    currentRegister = signal<CashRegisterResponse | null>(null);
    history = signal<CashRegisterResponse[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    // Open form
    openingAmount = signal<number>(0);
    openNotes = signal('');

    // Close form
    closingAmount = signal<number>(0);
    closeNotes = signal('');

    isOpen = computed(() => this.currentRegister()?.status === 'OPEN');
    hasBranch = computed(() => !!this.authService.currentUser()?.branchId);

    ngOnInit(): void { this.loadData(); }

    loadData(): void {
        this.loading.set(true);
        this.error.set(null);

        this.cashRegisterService.getCurrent().subscribe({
            next: reg => {
                this.currentRegister.set(reg);
                if (!reg) this.loadHistory();
                else { this.loading.set(false); this.loadHistory(); }
            },
            error: err => {
                // 204 No Content is a graceful "no open register" — not an error
                if (err.status === 204 || err.status === 0) {
                    this.currentRegister.set(null);
                    this.loadHistory();
                } else {
                    this.error.set('Error al cargar el estado de la caja.');
                    this.loading.set(false);
                }
            }
        });
    }

    private loadHistory(): void {
        this.cashRegisterService.getHistory().subscribe({
            next: h => { this.history.set(h); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    openRegister(): void {
        if (this.openingAmount() < 0) return;
        this.loading.set(true);
        this.error.set(null);
        this.cashRegisterService.open(this.openingAmount(), this.openNotes() || undefined).subscribe({
            next: reg => {
                this.currentRegister.set(reg);
                this.success.set('✓ Caja abierta correctamente');
                this.openingAmount.set(0);
                this.openNotes.set('');
                this.loading.set(false);
                setTimeout(() => this.success.set(null), 4000);
            },
            error: err => {
                this.error.set(err?.error?.message ?? 'Error al abrir la caja');
                this.loading.set(false);
            }
        });
    }

    closeRegister(): void {
        if (this.closingAmount() < 0) return;
        this.loading.set(true);
        this.error.set(null);
        this.cashRegisterService.close(this.closingAmount(), this.closeNotes() || undefined).subscribe({
            next: reg => {
                this.currentRegister.set(null);
                this.success.set('✓ Caja cerrada. Diferencia: ' + this.currencySymbol() + ' ' + (reg.difference ?? 0).toFixed(2));
                this.history.update(h => [reg, ...h]);
                this.closingAmount.set(0);
                this.closeNotes.set('');
                this.loading.set(false);
                setTimeout(() => this.success.set(null), 6000);
            },
            error: err => {
                this.error.set(err?.error?.message ?? 'Error al cerrar la caja');
                this.loading.set(false);
            }
        });
    }

    differenceClass(difference: number | null): string {
        if (difference == null) return '';
        if (difference > 0) return 'text-green-600';
        if (difference < 0) return 'text-red-600';
        return 'text-gray-600';
    }
}
