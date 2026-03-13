import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { BranchService } from '../../../core/services/branch.service';
import { RoleService } from '../../../core/services/role.service';
import { UserResponseDto } from '../../../core/api/model';

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

    getRoleBadgeColor(roleName?: string): string {
        if (!roleName) return 'bg-gray-100 text-gray-800';
        // Cycle through a palette based on role index for consistent but distinct colors
        const idx = this.roleService.roles().findIndex(r => r.name === roleName);
        const palette = [
            'bg-purple-100 text-purple-800',
            'bg-blue-100 text-blue-800',
            'bg-orange-100 text-orange-800',
            'bg-cyan-100 text-cyan-800',
            'bg-green-100 text-green-800',
            'bg-pink-100 text-pink-800',
        ];
        return idx >= 0 ? palette[idx % palette.length] : 'bg-gray-100 text-gray-800';
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
