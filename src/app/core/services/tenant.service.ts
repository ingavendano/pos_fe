import { Injectable, signal, inject, effect } from '@angular/core';

export interface TenantSettings {
    id: number;
    name: string;
    domain: string;
    currency: string;
    currencySymbol: string;
    nit?: string;
    nrc?: string;
    giro?: string;
    stockMultiplier: number;
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
        // Reactively re-load tenant settings whenever the current user changes.
        // This handles:
        //   1. Restoring session from localStorage (user available on startup)
        //   2. Logging in (user changes from null → user)
        //   3. Logging out (user changes to null → clear settings)
        effect(() => {
            const user = this.auth.currentUser();
            if (user?.tenantId) {
                this.loadTenantSettings(user.tenantId);
            } else {
                this.settings.set(null);
            }
        });
    }

    private loadTenantSettings(tenantId: number) {
        this.http.get<TenantSettings>(`${environment.apiUrl}/tenants/${tenantId}`).subscribe({
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

