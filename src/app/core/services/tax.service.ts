import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Tax } from '../api/model';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TaxService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private readonly API_URL = `${environment.apiUrl}`;

    taxes = signal<Tax[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor() { }

    loadTaxes() {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) {
            this.error.set('No se encontró información del tenant para cargar impuestos.');
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        // Let's load ALL taxes for the administrative view
        this.http.get<Tax[]>(`${this.API_URL}/taxes/tenant/${currentUser.tenantId}`)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (data) => this.taxes.set(data),
                error: (err) => {
                    console.error('Error fetching taxes', err);
                    this.error.set('Error al cargar la configuración de impuestos.');
                }
            });
    }

    getTaxes() {
        return this.taxes();
    }

    getActiveTaxes() {
        return this.taxes().filter(t => t.isActive);
    }

    createTax(tax: Partial<Tax>) {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) return null;

        return this.http.post<Tax>(`${this.API_URL}/taxes/tenant/${currentUser.tenantId}`, tax);
    }

    updateTax(id: number, tax: Partial<Tax>) {
        return this.http.put<Tax>(`${this.API_URL}/taxes/${id}`, tax);
    }

    deleteTax(id: number) {
        return this.http.delete<void>(`${this.API_URL}/taxes/${id}`);
    }
}
