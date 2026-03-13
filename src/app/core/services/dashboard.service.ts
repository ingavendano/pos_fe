import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Product, OrderResponseDto } from '../api/model';
import { environment } from '../../../environments/environment';

export interface DashboardSummary {
    todaySales: number;
    availableTables: number;
    occupiedTables: number;
    activeOrdersCount: number;
    lowStockProducts: Product[];
    recentOrders: OrderResponseDto[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/dashboard`;

    getSummary(): Observable<DashboardSummary> | null {
        const currentUser = this.authService.currentUser();
        if (!currentUser?.tenantId || !currentUser?.branchId) return null;

        return this.http.get<DashboardSummary>(`${this.API_URL}/summary/${currentUser.tenantId}/branch/${currentUser.branchId}`);
    }
}
