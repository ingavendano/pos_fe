import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface OrderItemRequestDto {
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}

export interface OrderRequestDto {
  customerId?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  items: OrderItemRequestDto[];
}

export interface OrderResponseDto {
    id: number;
    consecutiveNumber: number;
    status: string;
    total: number;
    discountType?: string;
    discountValue?: number;
    tableId: number;
    tableNumber: number;
    branchId: number;
    userId: number;
    waiterName: string;
    customer?: any;
    invoice?: any;
    items: any[];
}

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  createOrder(branchId: number, tableId: number, userId: number, orderDto: OrderRequestDto): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(`${this.apiUrl}/branch/${branchId}/table/${tableId}/user/${userId}`, orderDto);
  }

  updateOrder(orderId: number, orderDto: OrderRequestDto): Observable<OrderResponseDto> {
    return this.http.put<OrderResponseDto>(`${this.apiUrl}/${orderId}`, orderDto);
  }

  updateOrderStatus(orderId: number, status: string, paymentMethod: string = 'CASH'): Observable<OrderResponseDto> {
    return this.http.patch<OrderResponseDto>(`${this.apiUrl}/${orderId}/status`, { status, paymentMethod });
  }

  addItemsToOrder(orderId: number, items: OrderItemRequestDto[]): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(`${this.apiUrl}/${orderId}/items`, items);
  }
}
