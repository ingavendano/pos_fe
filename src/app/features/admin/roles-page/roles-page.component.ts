import {
    Component, OnInit, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { RoleService, RoleResponse, RoleRequest, PermissionResponse } from '../../../core/services/role.service';
import { MENU_STRUCTURE } from '../../../core/constants/menu-items';

const FLATTENED_COMPONENTS: { key: string; label: string }[] = [];
MENU_STRUCTURE.forEach(group => {
    group.items.forEach(item => {
        if (item.key && !FLATTENED_COMPONENTS.some(c => c.key === item.key)) {
            FLATTENED_COMPONENTS.push({ key: item.key, label: item.key === 'SETTINGS' ? 'Ajustes Generales' : item.label });
        }
    });
});

// Any missing ones from the original list that might not be in the sidebar yet?
const ORIGINAL_KEYS = ['BRANCHES', 'TABLES', 'TAXES', 'CUSTOMERS', 'INVENTORY'];
ORIGINAL_KEYS.forEach(key => {
    if (!FLATTENED_COMPONENTS.some(c => c.key === key)) {
        // Find them in the original list if they were there
        const labels: any = {
            'BRANCHES': 'Sucursales',
            'TABLES': 'Mesas',
            'TAXES': 'Impuestos y Tasas',
            'CUSTOMERS': 'Clientes',
            'INVENTORY': 'Inventario'
        };
        FLATTENED_COMPONENTS.push({ key, label: labels[key] || key });
    }
});

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
    menuStructure = MENU_STRUCTURE;
    availableComponents = FLATTENED_COMPONENTS;
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
        const permissionsControls = FLATTENED_COMPONENTS.map(comp => {
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
        return FLATTENED_COMPONENTS.find(c => c.key === key)?.label ?? key;
    }

    getComponentIndex(key: string | undefined): number {
        if (!key) return -1;
        return FLATTENED_COMPONENTS.findIndex(c => c.key === key);
    }
}
