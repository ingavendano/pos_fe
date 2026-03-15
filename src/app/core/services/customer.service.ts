import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface Customer {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    nit?: string;
    nrc?: string;
    giro?: string;
    documentType?: string;
    documentNumber?: string;
    departamento?: string;
    municipio?: string;
    complemento?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private get tenantId() { return this.authService.currentUser()?.tenantId; }
    private api = `${environment.apiUrl}/customers`;

    getAll(search?: string): Observable<Customer[]> {
        const params: Record<string, string> = {};
        if (search) params['search'] = search;
        return this.http.get<Customer[]>(`${this.api}/tenant/${this.tenantId}`, { params });
    }

    create(customer: Customer): Observable<Customer> {
        return this.http.post<Customer>(`${this.api}/tenant/${this.tenantId}`, customer);
    }

    update(id: number, customer: Customer): Observable<Customer> {
        return this.http.put<Customer>(`${this.api}/${id}`, customer);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.api}/${id}`);
    }
}
