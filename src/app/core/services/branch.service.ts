import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Branch } from '../api/model';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BranchService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private readonly API_URL = `${environment.apiUrl}`;

    branches = signal<Branch[]>([]);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    constructor() {
        this.loadBranches();
    }

    loadBranches() {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) {
            this.error.set('No se encontró información del tenant.');
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        this.http.get<Branch[]>(`${this.API_URL}/branches/tenant/${currentUser.tenantId}`)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe({
                next: (data) => this.branches.set(data),
                error: (err) => {
                    console.error('Error fetching branches', err);
                    this.error.set('Error al cargar las sucursales.');
                }
            });
    }

    getBranches() {
        return this.branches();
    }

    createBranch(branch: Partial<Branch>) {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) return null;

        return this.http.post<Branch>(`${this.API_URL}/branches/tenant/${currentUser.tenantId}`, branch);
    }

    updateBranch(id: number, branch: Partial<Branch>) {
        return this.http.put<Branch>(`${this.API_URL}/branches/${id}`, branch);
    }

    deleteBranch(id: number) {
        return this.http.delete<void>(`${this.API_URL}/branches/${id}`);
    }
}
