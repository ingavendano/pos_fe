import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Expense, ProfitabilityReport } from '../api/model/finance';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FinanceService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = environment.apiUrl;

    private get branchId(): number {
        return this.authService.currentUser()!.branchId!;
    }

    getExpenses(start?: string, end?: string): Observable<Expense[]> {
        let url = `${this.API_URL}/expenses/branch/${this.branchId}`;
        if (start && end) {
            url += `?start=${start}&end=${end}`;
        }
        return this.http.get<Expense[]>(url);
    }

    createExpense(expense: Expense): Observable<Expense> {
        return this.http.post<Expense>(`${this.API_URL}/expenses/branch/${this.branchId}`, expense);
    }

    deleteExpense(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/expenses/${id}`);
    }

    getProfitabilityReport(start: string, end: string): Observable<ProfitabilityReport> {
        return this.http.get<ProfitabilityReport>(
            `${this.API_URL}/reports/profitability/branch/${this.branchId}?start=${start}&end=${end}`
        );
    }
}
