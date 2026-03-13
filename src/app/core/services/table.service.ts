import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RestaurantTable } from '../api/model';

@Injectable({
    providedIn: 'root'
})
export class TableService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    // Using signals for reactive table management
    tables = signal<RestaurantTable[]>([]);
    activeTable = signal<RestaurantTable | null>(null);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    private readonly API_URL = `${environment.apiUrl}/tables`;

    constructor() {
        this.loadTables();
    }

    loadTables() {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.branchId) {
            this.error.set('No se encontró información de la sucursal para el usuario actual.');
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        this.http.get<RestaurantTable[]>(`${this.API_URL}/branch/${currentUser.branchId}`)
            .pipe(
                finalize(() => this.isLoading.set(false))
            )
            .subscribe({
                next: (data) => {
                    this.tables.set(data);
                },
                error: (err) => {
                    console.error('Error fetching tables', err);
                    this.error.set('Error al cargar las mesas.');
                }
            });
    }

    selectTable(table: RestaurantTable) {
        this.activeTable.set(table);
    }

    clearSelection() {
        this.activeTable.set(null);
    }

    getActiveOrder(tableId: number): Observable<any> {
        return this.http.get<any>(`http://localhost:8080/api/orders/table/${tableId}/active`);
    }

    // --- Admin CRUD Operations ---

    createTable(branchId: number, table: Partial<RestaurantTable>) {
        return this.http.post<RestaurantTable>(`${this.API_URL}/branch/${branchId}`, table);
    }

    updateTable(id: number, table: Partial<RestaurantTable>) {
        return this.http.put<RestaurantTable>(`${this.API_URL}/${id}`, table);
    }

    deleteTable(id: number) {
        return this.http.delete<void>(`${this.API_URL}/${id}`);
    }

    getTablesByBranchId(branchId: number) {
        // Useful for fetching tables without setting the global `tables` signal
        return this.http.get<RestaurantTable[]>(`${this.API_URL}/branch/${branchId}`);
    }
}
