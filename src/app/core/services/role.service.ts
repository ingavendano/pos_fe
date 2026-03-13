import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface PermissionResponse {
    id?: number;
    component: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

export interface RoleResponse {
    id: number;
    name: string;
    description: string;
    permissions: PermissionResponse[];
}

export interface RoleRequest {
    name: string;
    description: string;
    permissions: PermissionResponse[];
}

@Injectable({ providedIn: 'root' })
export class RoleService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/roles`;

    roles = signal<RoleResponse[]>([]);

    private get tenantId(): number {
        return this.authService.currentUser()!.tenantId;
    }

    loadRoles(): void {
        this.http.get<RoleResponse[]>(`${this.API_URL}/tenant/${this.tenantId}`)
            .subscribe(roles => this.roles.set(roles));
    }

    createRole(request: RoleRequest): Observable<RoleResponse> {
        return this.http.post<RoleResponse>(`${this.API_URL}/tenant/${this.tenantId}`, request).pipe(
            tap(() => this.loadRoles())
        );
    }

    updateRole(id: number, request: RoleRequest): Observable<RoleResponse> {
        return this.http.put<RoleResponse>(`${this.API_URL}/tenant/${this.tenantId}/${id}`, request).pipe(
            tap(() => this.loadRoles())
        );
    }

    deleteRole(id: number): Observable<void> {
        return this.http.delete<void>(`${this.API_URL}/tenant/${this.tenantId}/${id}`).pipe(
            tap(() => this.loadRoles())
        );
    }
}
