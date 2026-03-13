import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { Category } from '../../../core/api/model';

@Component({
    selector: 'app-categories-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categories-page.component.html'
})
export default class CategoriesPageComponent implements OnInit {
    catalogueService = inject(CatalogueService);

    searchTerm = signal('');

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingCategory = signal<Category | null>(null);

    categoryForm = {
        name: '',
        description: ''
    };

    filteredCategories = computed(() => {
        const term = this.searchTerm().toLowerCase();
        const categories = this.catalogueService.getCategories();

        if (!term) return categories;

        return categories.filter(c =>
            (c.name || '').toLowerCase().includes(term) ||
            (c.description && c.description.toLowerCase().includes(term))
        );
    });

    ngOnInit() {
        this.catalogueService.loadCatalogue();
    }

    openModal(category: Category | null = null) {
        this.editingCategory.set(category);
        if (category) {
            this.categoryForm = {
                name: category.name ?? '',
                description: category.description ?? ''
            };
        } else {
            this.categoryForm = { name: '', description: '' };
        }
        this.isModalOpen.set(true);
    }

    closeModal() {
        this.isModalOpen.set(false);
        this.categoryForm = { name: '', description: '' };
        this.editingCategory.set(null);
    }

    saveCategory() {
        if (!this.categoryForm.name) return;

        this.isSaving.set(true);

        const request$ = this.editingCategory()?.id
            ? this.catalogueService.updateCategory(this.editingCategory()!.id!, this.categoryForm)
            : this.catalogueService.createCategory(this.categoryForm);

        if (!request$) {
            this.isSaving.set(false);
            return;
        }

        request$.subscribe({
            next: () => {
                this.catalogueService.loadCatalogue();
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving category', err);
                alert('Ocurrió un error al guardar la categoría.');
            },
            complete: () => {
                this.isSaving.set(false);
            }
        });
    }

    deleteCategory(id: number) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Si tiene productos asociados, la operación podría fallar.')) {
            return;
        }

        this.catalogueService.deleteCategory(id).subscribe({
            next: () => {
                this.catalogueService.loadCatalogue();
            },
            error: (err) => {
                console.error('Error deleting category', err);
                alert('No se pudo eliminar la categoría. Es posible que tenga productos asociados.');
            }
        });
    }
}
