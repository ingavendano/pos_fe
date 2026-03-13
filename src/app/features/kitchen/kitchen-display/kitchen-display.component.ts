import {
    Component, OnInit, OnDestroy, signal, computed,
    ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { KitchenService, KitchenOrder } from '../../../core/services/kitchen.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-kitchen-display',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './kitchen-display.component.html',
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
    private kitchenService = inject(KitchenService);
    private authService = inject(AuthService);
    private router = inject(Router);

    orders = signal<KitchenOrder[]>([]);
    lastRefresh = signal<Date>(new Date());
    private pollSub?: Subscription;

    pendingOrders = computed(() => this.orders().filter(o => o.status === 'PENDING'));
    preparingOrders = computed(() => this.orders().filter(o => o.status === 'PREPARING'));
    readyOrders = computed(() => this.orders().filter(o => o.status === 'READY'));

    ngOnInit(): void {
        const user = this.authService.currentUser();
        if (!user?.branchId) {
            alert('Sin sucursal asignada — acceso a cocina denegado.');
            this.router.navigate(['/']);
            return;
        }

        this.pollSub = this.kitchenService.startPolling().subscribe(orders => {
            this.orders.set(orders);
            this.lastRefresh.set(new Date());
        });
    }

    ngOnDestroy(): void {
        this.pollSub?.unsubscribe();
    }

    advance(order: KitchenOrder): void {
        this.kitchenService.advanceOrder(order.id).subscribe(updated => {
            this.orders.update(list =>
                list.map(o => (o.id === updated.id ? updated : o))
                    .filter(o => o.status !== 'READY' || updated.id !== o.id)
            );
            // If moved to READY, remove after 3 seconds (kitchen acknowledged it)
            if (updated.status === 'READY') {
                setTimeout(() => {
                    this.orders.update(list => list.filter(o => o.id !== updated.id));
                }, 3000);
            }
        });
    }

    urgencyClass(minutes: number): string {
        if (minutes >= 15) return 'border-red-500 bg-red-50';
        if (minutes >= 8) return 'border-amber-400 bg-amber-50';
        return 'border-gray-200 bg-white';
    }

    statusLabel(status: string): string {
        const labels: Record<string, string> = {
            PENDING: 'Nuevo Pedido',
            PREPARING: 'En Preparación',
            READY: '¡Listo!'
        };
        return labels[status] ?? status;
    }

    nextActionLabel(status: string): string {
        const labels: Record<string, string> = {
            PENDING: 'Empezar a Preparar',
            PREPARING: 'Marcar Listo ✓'
        };
        return labels[status] ?? '';
    }
}
