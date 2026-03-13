import {
    Component, OnInit, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RoleService, RoleResponse, RoleRequest, PermissionResponse } from '../../../core/services/role.service';

const AVAILABLE_COMPONENTS: { key: string; label: string }[] = [
    { key: 'DASHBOARD', label: 'Dashboard' },
    { key: 'POS', label: 'Punto de Venta' },
    { key: 'INVOICES', label: 'Facturas' },
    { key: 'PRODUCTS', label: 'Catálogo de Productos' },
    { key: 'CATEGORIES', label: 'Catálogo de Categorías' },
    { key: 'BRANCHES', label: 'Sucursales' },
    { key: 'TABLES', label: 'Mesas' },
    { key: 'USERS', label: 'Personal / Usuarios' },
    { key: 'ROLES', label: 'Roles y Permisos' },
    { key: 'TAXES', label: 'Impuestos y Tasas' },
    { key: 'CUSTOMERS', label: 'Clientes' },
    { key: 'REPORTS', label: 'Reportes y Análisis' },
    { key: 'INVENTORY', label: 'Inventario' },
    { key: 'SETTINGS', label: 'Ajustes Generales' },
];

@Component({
    selector: 'app-roles-page',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './roles-page.component.html',
})
export class RolesPageComponent implements OnInit {
    private roleService = inject(RoleService);
    private fb = inject(FormBuilder);

    roles = this.roleService.roles;
    availableComponents = AVAILABLE_COMPONENTS;
    showModal = signal(false);
    editingRole = signal<RoleResponse | null>(null);
    errorMessage = signal<string | null>(null);
    isSaving = signal(false);

    form!: FormGroup;

    get permissionsArray(): FormArray {
        return this.form.get('permissions') as FormArray;
    }

    ngOnInit(): void {
        this.roleService.loadRoles();
        this.initForm();
    }

    initForm(role?: RoleResponse): void {
        const permissionsControls = AVAILABLE_COMPONENTS.map(comp => {
            const existing = role?.permissions.find(p => p.component === comp.key);
            return this.fb.group({
                component: [comp.key],
                canRead: [existing?.canRead ?? false],
                canWrite: [existing?.canWrite ?? false],
                canDelete: [existing?.canDelete ?? false],
            });
        });

        this.form = this.fb.group({
            name: [role?.name ?? '', Validators.required],
            description: [role?.description ?? ''],
            permissions: this.fb.array(permissionsControls),
        });
    }

    openCreateModal(): void {
        this.editingRole.set(null);
        this.errorMessage.set(null);
        this.initForm();
        this.showModal.set(true);
    }

    openEditModal(role: RoleResponse): void {
        this.editingRole.set(role);
        this.errorMessage.set(null);
        this.initForm(role);
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
    }

    save(): void {
        if (this.form.invalid) return;

        this.isSaving.set(true);
        this.errorMessage.set(null);

        const request: RoleRequest = this.form.value as RoleRequest;
        const editing = this.editingRole();

        const op$ = editing
            ? this.roleService.updateRole(editing.id, request)
            : this.roleService.createRole(request);

        op$.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeModal();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.errorMessage.set(err?.error?.message ?? 'Ocurrió un error al guardar el rol.');
            }
        });
    }

    deleteRole(role: RoleResponse): void {
        if (!confirm(`¿Eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`)) return;
        this.roleService.deleteRole(role.id).subscribe({
            error: (err) => alert(err?.error?.message ?? 'No se pudo eliminar el rol.')
        });
    }

    getLabelForComponent(key: string): string {
        return AVAILABLE_COMPONENTS.find(c => c.key === key)?.label ?? key;
    }
}
