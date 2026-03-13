import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchService } from '../../../core/services/branch.service';
import { Branch } from '../../../core/api/model';

@Component({
    selector: 'app-branches-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './branches-page.component.html'
})
export default class BranchesPageComponent implements OnInit {
    branchService = inject(BranchService);

    searchTerm = signal('');

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingBranch = signal<Branch | null>(null);

    branchForm = {
        name: '',
        address: '',
        phone: ''
    };

    filteredBranches = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const branches = this.branchService.getBranches();

        if (!term) return branches;

        return branches.filter(b =>
            (b.name ?? '').toLowerCase().includes(term) ||
            (b.address ?? '').toLowerCase().includes(term) ||
            (b.phone ?? '').toLowerCase().includes(term)
        );
    });

    ngOnInit() {
        this.branchService.loadBranches();
    }

    openModal(branch: Branch | null = null) {
        this.editingBranch.set(branch);
        if (branch) {
            this.branchForm = {
                name: branch.name ?? '',
                address: branch.address || '',
                phone: branch.phone || ''
            };
        } else {
            this.branchForm = { name: '', address: '', phone: '' };
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.branchForm = { name: '', address: '', phone: '' };
        this.editingBranch.set(null);
    }

    saveBranch() {
        if (!this.branchForm.name) return;

        this.isSaving.set(true);

        const request$ = this.editingBranch()?.id
            ? this.branchService.updateBranch(this.editingBranch()!.id!, this.branchForm)
            : this.branchService.createBranch(this.branchForm);

        if (!request$) {
            this.isSaving.set(false);
            return;
        }

        request$.subscribe({
            next: () => {
                this.branchService.loadBranches();
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving branch', err);
                alert('Ocurrió un error al guardar la sucursal.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }

    deleteBranch(id: number) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta sucursal? Ten en cuenta que si tiene mesas o usuarios asignados podría fallar.')) {
            return;
        }

        this.branchService.deleteBranch(id).subscribe({
            next: () => {
                this.branchService.loadBranches();
            },
            error: (err) => {
                console.error('Error deleting branch', err);
                alert('No se pudo eliminar la sucursal. Es posible que tenga mesas u órdenes asociadas.');
            }
        });
    }
}
