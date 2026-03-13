import { Injectable, signal, inject } from '@angular/core';

export interface TenantSettings {
    id: number;
    name: string;
    domain: string;
    currency: string;
    currencySymbol: string;
    nit?: string;
    nrc?: string;
    giro?: string;
}

import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, tap } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);

    settings = signal<TenantSettings | null>(null);

    constructor() {
        this.loadTenantSettings();
    }

    private loadTenantSettings() {
        const user = this.auth.currentUser();
        if (!user || !user.tenantId) {
            return;
        }

        this.http.get<TenantSettings>(`${environment.apiUrl}/tenants/${user.tenantId}`).subscribe({
            next: (data) => this.settings.set(data),
            error: (err) => console.error('Error loading tenant settings', err)
        });
    }

    updateTenant(id: number, data: Partial<TenantSettings>): Observable<TenantSettings> {
        return this.http.put<TenantSettings>(`${environment.apiUrl}/tenants/${id}`, data).pipe(
            tap(updated => this.settings.set(updated))
        );
    }

    getCurrencyCode(): string {
        return this.settings()?.currency || 'USD';
    }
}
