import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Warehouse, Inventory, Product } from '../api/model';

export interface StockMovement {
    id?: number;
    inventory: Inventory;
    movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reason?: string;
    createdAt: string;
    createdBy?: any;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly api = `${environment.apiUrl}`;

    private get tenantId() { return this.authService.currentUser()?.tenantId; }

    // Warehouse CRUD
    getWarehouses(): Observable<Warehouse[]> {
        return this.http.get<Warehouse[]>(`${this.api}/warehouses/tenant/${this.tenantId}`);
    }

    createWarehouse(warehouse: any): Observable<Warehouse> {
        return this.http.post<Warehouse>(`${this.api}/warehouses/tenant/${this.tenantId}`, warehouse);
    }

    updateWarehouse(id: number, warehouse: any): Observable<Warehouse> {
        return this.http.put<Warehouse>(`${this.api}/warehouses/${id}`, warehouse);
    }

    deleteWarehouse(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/warehouses/${id}`);
    }

    // Inventory & Movements
    getStock(warehouseId: number): Observable<Inventory[]> {
        return this.http.get<Inventory[]>(`${this.api}/inventory/warehouse/${warehouseId}`);
    }

    getLowStockAlerts(): Observable<Inventory[]> {
        return this.http.get<Inventory[]>(`${this.api}/inventory/alerts/tenant/${this.tenantId}`);
    }

    adjustStock(warehouseId: number, adjustment: {
        productId: number,
        quantity: number,
        type: 'IN' | 'OUT' | 'ADJUSTMENT',
        reason?: string,
        userId?: number
    }): Observable<Inventory> {
        return this.http.post<Inventory>(`${this.api}/inventory/warehouse/${warehouseId}/adjust`, adjustment);
    }

    getMovements(warehouseId: number): Observable<StockMovement[]> {
        return this.http.get<StockMovement[]>(`${this.api}/inventory/movements/warehouse/${warehouseId}`);
    }
}
