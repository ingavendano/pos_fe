import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith, share } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface KitchenItem {
    id: number;
    productName: string;
    quantity: number;
    notes: string | null;
    status: 'PENDING' | 'PREPARING' | 'READY';
}

export interface KitchenOrder {
    id: number;
    tableNumber: string;
    waiterName: string;
    status: 'PENDING' | 'PREPARING' | 'READY';
    createdAt: string;
    minutesElapsed: number;
    items: KitchenItem[];
}

const POLL_INTERVAL_MS = 10_000; // 10 seconds

@Injectable({ providedIn: 'root' })
export class KitchenService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/kitchen`;

    orders = signal<KitchenOrder[]>([]);
    isPolling = signal(false);

    private get branchId(): number {
        return this.authService.currentUser()!.branchId!;
    }

    /** Returns an Observable that polls every 10 seconds */
    startPolling(categoryIds: number[] = []): Observable<KitchenOrder[]> {
        this.isPolling.set(true);
        return interval(POLL_INTERVAL_MS).pipe(
            startWith(0),
            switchMap(() => {
                let params = '';
                if (categoryIds.length > 0) {
                    params = `?categoryIds=${categoryIds.join(',')}`;
                }
                return this.http.get<KitchenOrder[]>(`${this.API_URL}/branch/${this.branchId}${params}`);
            }),
            share()
        );
    }

    advanceOrder(orderId: number): Observable<KitchenOrder> {
        return this.http.patch<KitchenOrder>(`${this.API_URL}/orders/${orderId}/advance`, {});
    }
}
