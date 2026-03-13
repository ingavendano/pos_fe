import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface DailySales { date: string; revenue: number; invoiceCount: number; }
export interface ProductSales { productName: string; quantitySold: number; revenue: number; }
export interface PaymentMethodBreakdown { method: string; count: number; total: number; percentage: number; }
export interface WaiterSales { waiterName: string; ordersServed: number; revenue: number; }

export interface SalesReport {
    totalRevenue: number;
    totalTax: number;
    totalSubtotal: number;
    totalInvoices: number;
    averageTicket: number;
    dailySales: DailySales[];
    revenueByHour: Record<number, number>;
    topProducts: ProductSales[];
    paymentMethods: PaymentMethodBreakdown[];
    topWaiters: WaiterSales[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/reports`;

    private get tenantId(): number { return this.auth.currentUser()!.tenantId; }

    getSalesReport(from: string, to: string): Observable<SalesReport> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http.get<SalesReport>(`${this.API_URL}/tenant/${this.tenantId}/sales`, { params });
    }
}
