import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { UserResponseDto, User } from '../api/model';
import { finalize } from 'rxjs/operators';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private readonly API_URL = `${environment.apiUrl}`;

    users = signal<UserResponseDto[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor() { }

    loadUsers() {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) {
            this.error.set('No se encontró información del tenant para cargar usuarios.');
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        this.http.get<UserResponseDto[]>(`${this.API_URL}/users/tenant/${currentUser.tenantId}`)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (data) => this.users.set(data),
                error: (err) => {
                    console.error('Error fetching users', err);
                    this.error.set('Error al cargar al personal.');
                }
            });
    }

    getUsers() {
        return this.users();
    }

    createUser(user: Partial<User>, branchId?: number) {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) return null;

        let url = `${this.API_URL}/users/tenant/${currentUser.tenantId}`;
        if (branchId) {
            url += `?branchId=${branchId}`;
        }

        return this.http.post<UserResponseDto>(url, user);
    }

    updateUser(id: number, user: Partial<User> & { branchId?: number | null }) {
        // branchId is sent as a query param to the backend, not in the body
        const { branchId, ...body } = user;
        let url = `${this.API_URL}/users/${id}`;
        if (branchId !== undefined) {
            url += `?branchId=${branchId ?? ''}`;
        }
        return this.http.put<UserResponseDto>(url, body);
    }

    deactivateUser(id: number) {
        return this.http.patch<void>(`${this.API_URL}/users/${id}/deactivate`, {});
    }
}
