import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface CashRegisterResponse {
    id: number;
    status: 'OPEN' | 'CLOSED';
    openingAmount: number;
    openedAt: string;
    openedByName: string;
    closingAmount: number | null;
    closedAt: string | null;
    closedByName: string | null;
    totalCash: number;
    totalCard: number;
    totalTransfer: number;
    totalSales: number;
    difference: number | null;
    notes: string | null;
    branchName: string;
}

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private readonly BASE = `${environment.apiUrl}/cash-registers`;

    /** Signal matching current register status for UI reactivity */
    status = signal<'OPEN' | 'CLOSED' | 'UNKNOWN'>('UNKNOWN');

    private get branchId(): number { return this.auth.currentUser()?.branchId ?? 0; }

    /** Fetch status and update signal */
    refreshStatus(): void {
        const bid = this.branchId;
        if (!bid) {
            this.status.set('UNKNOWN');
            return;
        }

        this.getCurrent().subscribe({
            next: reg => this.status.set(reg.status),
            error: () => this.status.set('CLOSED') // 404 or error usually means closed
        });
    }

    getCurrent(): Observable<CashRegisterResponse> {
        return this.http.get<CashRegisterResponse>(`${this.BASE}/branch/${this.branchId}/current`).pipe(
            tap(reg => this.status.set(reg.status))
        );
    }

    getHistory(): Observable<CashRegisterResponse[]> {
        return this.http.get<CashRegisterResponse[]>(`${this.BASE}/branch/${this.branchId}/history`);
    }

    open(openingAmount: number, notes?: string): Observable<CashRegisterResponse> {
        return this.http.post<CashRegisterResponse>(
            `${this.BASE}/branch/${this.branchId}/open`,
            { openingAmount, notes }
        ).pipe(
            tap(reg => this.status.set(reg.status))
        );
    }

    close(closingAmount: number, notes?: string): Observable<CashRegisterResponse> {
        return this.http.patch<CashRegisterResponse>(
            `${this.BASE}/branch/${this.branchId}/close`,
            { closingAmount, notes }
        ).pipe(
            tap(reg => this.status.set(reg.status))
        );
    }
}
