import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/pos.models';
import { OrderResponseDto } from '../api/model';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private readonly API_URL = `${environment.apiUrl}/orders`;

    // State: List of orders/invoices (loaded from the current page)
    invoices = signal<OrderResponseDto[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    /**
     * Load recent orders/invoices for the active branch
     */
    loadInvoices(): Observable<OrderResponseDto[]> {
        this.isLoading.set(true);
        this.error.set(null);

        const branchId = this.authService.currentUser()?.branchId;
        if (!branchId) {
            this.isLoading.set(false);
            this.error.set('No se encontró sucursal activa para el usuario.');
            // Send empty mock page
            return new Observable<OrderResponseDto[]>(subscriber => subscriber.next([]));
        }

        // Request a large page of recent invoices to populate the list. Future enhancement: add Next Page button.
        return this.http.get<OrderResponseDto[]>(`${this.API_URL}/branch/${branchId}`).pipe(
            tap({
                next: (orders) => {
                    this.invoices.set(Array.isArray(orders) ? orders : []);
                    this.isLoading.set(false);
                },
                error: (err) => {
                    console.error('Error fetching invoices', err);
                    this.error.set('No se pudieron cargar las facturas.');
                    this.isLoading.set(false);
                }
            })
        );
    }
}
