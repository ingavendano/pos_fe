import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PermissionResponse {
    id?: number;
    component: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

export interface PublicTenantResponse {
    name: string;
    currencySymbol: string;
    currency: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    username: string;
    name: string;
    role: string;
    tenantId: number;
    branchId?: number;
    branchName?: string;
    permissions: PermissionResponse[];
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // We manage the active user state via a signal
    public currentUser = signal<AuthResponse | null>(null);
    public tenantInfo = signal<PublicTenantResponse | null>(null);
    public domainRegistered = signal<boolean | null>(null); // null = unknown, true = yes, false = no

    private readonly API_URL = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'pos_auth_token';
    private readonly USER_KEY = 'pos_auth_user';

    constructor() {
        this.loadUserFromStorage();
        this.loadTenantInfo();
    }

    loadTenantInfo(): void {
        this.http.get<PublicTenantResponse>(`${environment.apiUrl}/tenants/public/info`)
            .subscribe({
                next: (info) => {
                    this.tenantInfo.set(info);
                    this.domainRegistered.set(true);
                },
                error: (err) => {
                    console.warn('No se pudo cargar la información del tenant desde este dominio.');
                    if (err.status === 404) {
                        this.domainRegistered.set(false);
                    }
                }
            });
    }
    login(username: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.API_URL}/login`, { username, password }).pipe(
            tap(response => {
                this.saveAuthData(response);
            }),
            catchError(error => {
                return throwError(() => error);
            })
        );
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private saveAuthData(authResponse: AuthResponse) {
        localStorage.setItem(this.TOKEN_KEY, authResponse.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse));
        this.currentUser.set(authResponse);
    }

    private loadUserFromStorage() {
        const token = this.getToken();
        const userStr = localStorage.getItem(this.USER_KEY);

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthResponse;
                this.currentUser.set(user);
            } catch (e) {
                this.logout();
            }
        }
    }

    hasPermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canRead : false;
    }

    hasWritePermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canWrite : false;
    }

    hasDeletePermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canDelete : false;
    }

    hasRole(roleName: string): boolean {
        return this.currentUser()?.role === roleName;
    }
}
