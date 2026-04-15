import {
    Component, OnInit, OnDestroy, signal, computed,
    ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { KitchenService, KitchenOrder } from '../../../core/services/kitchen.service';
import { AuthService } from '../../../core/services/auth.service';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { Router } from '@angular/router';
import { StompClientService } from '../../../core/services/stomp-client.service';
import { take } from 'rxjs/operators';

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
    private catalogueService = inject(CatalogueService);
    private router = inject(Router);
    private stompClient = inject(StompClientService);

    orders = signal<KitchenOrder[]>([]);
    lastRefresh = signal<Date>(new Date());
    selectedCategoryIds = signal<number[]>([]);
    availableCategories = computed(() => this.catalogueService.getCategories());
    
    private wsSub?: Subscription;

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

        this.catalogueService.loadCatalogue();
        this.forceRefresh();

        // Subscribe to real-time events from KDS Topic
        this.wsSub = this.stompClient.watch(`/topic/kitchen/${user.branchId}`).subscribe(message => {
            console.log('Real-Time KDS Event:', message.body);
            // Trigger an immediate UI refresh when an order is created, modified or cancelled
            this.forceRefresh();
        });
    }

    forceRefresh() {
        this.kitchenService.fetchOrders(this.selectedCategoryIds()).pipe(take(1)).subscribe(orders => {
            this.orders.set(orders);
            this.lastRefresh.set(new Date());
        });
    }

    toggleCategory(categoryId: number) {
        this.selectedCategoryIds.update(ids => 
            ids.includes(categoryId) 
                ? ids.filter(id => id !== categoryId) 
                : [...ids, categoryId]
        );
        this.forceRefresh();
    }

    ngOnDestroy(): void {
        this.wsSub?.unsubscribe();
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
        if (minutes >= 15) return 'border-red-500 bg-red-950/50 text-white';
        if (minutes >= 8) return 'border-amber-400 bg-amber-950/50 text-white';
        return 'border-gray-700 bg-gray-900/50 text-gray-200';
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
