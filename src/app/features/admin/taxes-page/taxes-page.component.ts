import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaxService } from '../../../core/services/tax.service';
import { Tax } from '../../../core/api/model';

@Component({
    selector: 'app-taxes-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './taxes-page.component.html'
})
export default class TaxesPageComponent implements OnInit {
    taxService = inject(TaxService);

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingTax = signal<Tax | null>(null);

    taxForm = {
        name: '',
        percentage: 16,
        isActive: true,
        type: 'STANDARD' as 'STANDARD' | 'TIP' | 'RETENTION'
    };

    ngOnInit() {
        this.taxService.loadTaxes();
    }

    isFormValid() {
        return this.taxForm.name.trim() !== '' && this.taxForm.percentage >= 0;
    }

    openModal(tax: Tax | null = null) {
        this.editingTax.set(tax);
        if (tax) {
            this.taxForm = {
                name: tax.name ?? '',
                percentage: tax.percentage ?? 16,
                isActive: tax.isActive ?? true,
                type: tax.type ?? 'STANDARD'
            };
        } else {
            this.taxForm = { name: '', percentage: 16, isActive: true, type: 'STANDARD' };
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.editingTax.set(null);
    }

    saveTax() {
        this.isSaving.set(true);

        const payload: Partial<Tax> = {
            name: this.taxForm.name,
            percentage: this.taxForm.percentage,
            isActive: this.taxForm.isActive,
            type: this.taxForm.type
        };

        const request$ = this.editingTax()?.id
            ? this.taxService.updateTax(this.editingTax()!.id!, payload)
            : this.taxService.createTax(payload);

        if (!request$) {
            this.isSaving.set(false);
            return;
        }

        request$.subscribe({
            next: () => {
                this.taxService.loadTaxes();
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving tax', err);
                alert('Ocurrió un error al guardar o actualizar la tasa.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }

    toggleActive(tax: Tax) {
        const toggledState = !(tax.isActive ?? true);
        const payload: Partial<Tax> = { isActive: toggledState };
        this.taxService.updateTax(tax.id!, payload).subscribe({
            next: () => this.taxService.loadTaxes(),
            error: (err) => console.error('Error toggling tax active state', err)
        });
    }

    deleteTax(id: number) {
        if (!confirm('¿Borrar definitivamente esta regla fiscal? Esto podría traer inconsistencias en las facturas pasadas que dependan estrictamente de este Id (usualmente se recomienda desactivar en lugar de borrar).')) {
            return;
        }

        this.taxService.deleteTax(id).subscribe({
            next: () => {
                this.taxService.loadTaxes();
            },
            error: (err) => {
                console.error('Error deleting tax', err);
                alert('No se pudo borrar, sugerimos alternar su estado a Inactivo');
            }
        });
    }
}
