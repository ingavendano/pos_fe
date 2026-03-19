import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ThemeService } from './theme/theme.service';

export interface PermissionResponse {
    id?: number;
    component: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

export interface PublicTenantResponse {
    name: string;
    domain?: string;
    currencySymbol: string;
    currency: string;
    theme: string;
}

export interface AuthResponse {
    token: string;
    refreshToken?: string;
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
    private themeService = inject(ThemeService);

    public currentUser = signal<AuthResponse | null>(null);
    public tenantInfo = signal<PublicTenantResponse | null>(null);
    public domainRegistered = signal<boolean | null>(null);

    private readonly API_URL = `${environment.apiUrl}/auth`;
    private readonly TOKEN_KEY = 'pos_auth_token';
    private readonly USER_KEY = 'pos_auth_user';

    // Evita llamadas concurrentes a /me si ya hay una en vuelo
    private refreshingPermissions = false;

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
                    if (info.theme) {
                        this.themeService.applyTheme(info.theme);
                    }
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

    logout(): void {
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

    /**
     * Llama a GET /api/auth/me para obtener permisos y rol frescos desde la DB.
     * También rota el token silenciosamente si el backend retorna uno nuevo.
     * Se llama automáticamente al iniciar la app si hay un token guardado.
     */
    refreshUserPermissions(): void {
        if (this.refreshingPermissions) return;
        this.refreshingPermissions = true;

        this.http.get<AuthResponse>(`${this.API_URL}/me`).subscribe({
            next: (freshUser) => {
                this.saveAuthData(freshUser);
                this.refreshingPermissions = false;
            },
            error: (err) => {
                this.refreshingPermissions = false;
                // Si el token ya no es válido, hacemos logout limpio
                if (err.status === 401) {
                    this.logout();
                }
            }
        });
    }

    private saveAuthData(authResponse: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, authResponse.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(authResponse));
        this.currentUser.set(authResponse);
    }

    private loadUserFromStorage(): void {
        const token = this.getToken();
        const userStr = localStorage.getItem(this.USER_KEY);

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr) as AuthResponse;
                this.currentUser.set(user);
                // Refresca permisos en segundo plano sin bloquear la UI
                this.refreshUserPermissions();
            } catch (e) {
                this.logout();
            }
        }
    }

    /** True si es ADMIN (sin importar mayúsculas) o si tiene permiso de lectura en el componente. */
    hasPermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role?.toUpperCase() === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canRead : false;
    }

    hasWritePermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role?.toUpperCase() === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canWrite : false;
    }

    hasDeletePermission(component: string): boolean {
        const user = this.currentUser();
        if (!user) return false;
        if (user.role?.toUpperCase() === 'ADMIN') return true;
        const permission = user.permissions?.find(p => p.component === component);
        return permission ? permission.canDelete : false;
    }

    hasRole(roleName: string): boolean {
        const role = this.currentUser()?.role;
        return role != null && role.toUpperCase() === roleName.toUpperCase();
    }
}
