import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { BranchService } from '../../../core/services/branch.service';
import { RoleService } from '../../../core/services/role.service';
import { UserResponseDto } from '../../../core/api/model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-users-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users-page.component.html'
})
export default class UsersPageComponent implements OnInit {
    userService = inject(UserService);
    branchService = inject(BranchService);
    roleService = inject(RoleService);
    authService = inject(AuthService);

    searchTerm = signal('');
    filterRole = signal<string | null>(null);

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingUser = signal<UserResponseDto | null>(null);

    userForm = {
        name: '',
        username: '',
        password: '',
        roleName: '' as string,
        branchId: null as number | null
    };

    filteredUsers = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const roleMatch = this.filterRole();
        const users = this.userService.getUsers();

        return users.filter(u => {
            const matchesSearch = !term ||
                (u.name || '').toLowerCase().includes(term) ||
                (u.username || '').toLowerCase().includes(term);
            const matchesRole = !roleMatch || u.roleName === roleMatch;
            return matchesSearch && matchesRole;
        });
    });

    ngOnInit() {
        this.userService.loadUsers();
        this.roleService.loadRoles();
        if (this.branchService.getBranches().length === 0) {
            this.branchService.loadBranches();
        }
    }

    getBranchName(id?: number): string {
        if (!id) return 'Todas (Global)';
        const branch = this.branchService.getBranches().find(b => b.id === id);
        return branch ? (branch.name ?? 'Desconocida') : 'Desconocida';
    }

    getRoleName(roleName?: string): string {
        if (!roleName) return '';
        const role = this.roleService.roles().find(r => r.name === roleName);
        return role ? role.name : roleName;
    }

    getUserIcon(roleName?: string): string {
        const lower = (roleName || '').toLowerCase();
        if (lower.includes('admin')) return 'shield-check';
        if (lower.includes('cocina')) return 'flame';
        if (lower.includes('mesero') || lower.includes('waiter')) return 'shopping-bag';
        if (lower.includes('caja') || lower.includes('cashier')) return 'banknote';
        return 'user';
    }

    getRoleBadgeColor(roleName?: string): string {
        if (!roleName) return 'bg-gray-100 text-gray-800';
        const lower = roleName.toLowerCase();
        if (lower.includes('admin')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (lower.includes('cocina')) return 'bg-amber-50 text-amber-600 border-amber-100';
        if (lower.includes('mesero')) return 'bg-blue-50 text-blue-600 border-blue-100';
        if (lower.includes('caja')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }

    isFormValid() {
        const basicValidation = this.userForm.name.trim() !== '' && this.userForm.username.trim() !== '';
        if (!this.editingUser()) { // new user
            return basicValidation && this.userForm.password.trim() !== '';
        }
        return basicValidation;
    }

    openModal(user: UserResponseDto | null = null) {
        this.editingUser.set(user);
        if (user) {
            this.userForm = {
                name: user.name ?? '',
                username: user.username ?? '',
                password: '', // Never show hashed logic password
                roleName: user.roleName || '',
                branchId: user.branchId || null
            };
        } else {
            // Default to first role available, or empty string
            const defaultRole = this.roleService.roles()[0]?.name || '';
            this.userForm = { name: '', username: '', password: '', roleName: defaultRole, branchId: null };
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.editingUser.set(null);
    }

    saveUser() {
        this.isSaving.set(true);

        const payload: any = {
            name: this.userForm.name,
            username: this.userForm.username,
            role: { name: this.userForm.roleName }
        };

        if (this.userForm.password) {
            payload.password = this.userForm.password;
        }

        // Always include branchId so it can be set or cleared (null = no specific branch)
        payload.branchId = this.userForm.branchId ?? null;

        const request$ = this.editingUser()?.id
            ? this.userService.updateUser(this.editingUser()!.id!, payload)
            : this.userService.createUser(payload, this.userForm.branchId || undefined);

        if (!request$) {
            this.isSaving.set(false);
            return;
        }

        request$.subscribe({
            next: () => {
                this.userService.loadUsers();
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving user', err);
                alert('Ocurrió un error al guardar o actualizar el personal.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }

    deactivateUser(user: UserResponseDto) {
        if (!confirm(`¿Estás seguro de que deseas dar de baja al usuario ${user.username}?`)) {
            return;
        }

        const payload: any = { isActive: false };
        this.userService.updateUser(user.id!, payload).subscribe({
            next: () => {
                this.userService.loadUsers();
            },
            error: (err) => {
                console.error('Error deactivating user', err);
                alert('No se pudo suspender al operador.');
            }
        });
    }

    activateUser(user: UserResponseDto) {
        // Small trick: to reactivate, we send an update toggling isActive
        const payload: any = { isActive: true };
        this.userService.updateUser(user.id!, payload).subscribe({
            next: () => this.userService.loadUsers(),
            error: (err) => console.error('Error activating user', err)
        });
    }
}
