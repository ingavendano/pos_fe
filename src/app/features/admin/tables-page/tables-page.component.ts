import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableService } from '../../../core/services/table.service';
import { BranchService } from '../../../core/services/branch.service';
import { RestaurantTable, Branch } from '../../../core/api/model';

@Component({
    selector: 'app-tables-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './tables-page.component.html'
})
export default class TablesPageComponent implements OnInit {
    tableService = inject(TableService);
    branchService = inject(BranchService);

    searchTerm = signal('');
    filterBranchId = signal<number | null>(null);
    tablesList = signal<RestaurantTable[]>([]);
    isLoadingTables = signal(false);

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingTable = signal<RestaurantTable | null>(null);

    tableForm = {
        number: 1,
        capacity: 2,
        status: 'AVAILABLE',
        posX: 0,
        posY: 0
    };

    filteredTables = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const tables = this.tablesList();

        if (!term) return tables;

        return tables.filter(t =>
            (t.number?.toString() ?? '').includes(term) ||
            (t.capacity?.toString() ?? '').includes(term) ||
            (t.status?.toLowerCase() ?? '').includes(term)
        );
    });

    ngOnInit() {
        this.branchService.loadBranches();
        // Default to first branch if available
        const branches = this.branchService.getBranches();
        if (branches.length > 0) {
            this.filterBranchId.set(branches[0].id!);
            this.onBranchChange();
        }
    }

    onBranchChange() {
        const branchId = this.filterBranchId();
        if (!branchId) {
            this.tablesList.set([]);
            return;
        }

        this.isLoadingTables.set(true);
        this.tableService.getTablesByBranchId(branchId).subscribe({
            next: (tables) => this.tablesList.set(tables),
            error: (err) => console.error('Error loading tables for branch', err),
            complete: () => this.isLoadingTables.set(false)
        });
    }

    getBranchName(id: number | null): string {
        if (!id) return '';
        const branch = this.branchService.getBranches().find(b => b.id === id);
        return branch ? (branch.name ?? 'Desconocida') : 'Desconocida';
    }

    isFormValid() {
        return this.tableForm.number > 0 && this.tableForm.capacity > 0;
    }

    openModal(table: RestaurantTable | null = null) {
        this.editingTable.set(table);
        if (table) {
            this.tableForm = {
                number: table.number ?? 1,
                capacity: table.capacity ?? 2,
                status: table.status ?? 'AVAILABLE',
                posX: table.posX ?? 0,
                posY: table.posY ?? 0
            };
        } else {
            this.tableForm = { number: 1, capacity: 2, status: 'AVAILABLE', posX: 0, posY: 0 };
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.editingTable.set(null);
    }

    saveTable() {
        if (!this.filterBranchId()) return;

        this.isSaving.set(true);

        const branchId = this.filterBranchId()!;
        const payload: Partial<RestaurantTable> = {
            number: this.tableForm.number,
            capacity: this.tableForm.capacity,
            status: this.tableForm.status,
            posX: this.tableForm.posX,
            posY: this.tableForm.posY,
            branch: { id: branchId }
        };

        const request$ = this.editingTable()?.id
            ? this.tableService.updateTable(this.editingTable()!.id!, payload)
            : this.tableService.createTable(branchId, payload);

        request$.subscribe({
            next: () => {
                this.onBranchChange(); // Reload view
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving table', err);
                alert('Ocurrió un error al guardar o actualizar la mesa.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }

    deleteTable(id: number) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta mesa? No será posible si tiene cobros asociados.')) {
            return;
        }

        this.tableService.deleteTable(id).subscribe({
            next: () => {
                this.onBranchChange();
            },
            error: (err) => {
                console.error('Error deleting table', err);
                alert('No se pudo eliminar la mesa. Sugerimos cambiar su estatus a Reservado en su defecto.');
            }
        });
    }
}
