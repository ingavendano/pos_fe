import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { Category } from '../../../core/api/model';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-categories-page',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './categories-page.component.html'
})
export default class CategoriesPageComponent implements OnInit {
    catalogueService = inject(CatalogueService);
    authService = inject(AuthService);

    searchTerm = signal('');

    // Modal state
    isModalOpen = signal(false);
    isSaving = signal(false);
    editingCategory = signal<Category | null>(null);

    getCategoryIcon(name: string): string {
        const lower = (name || '').toLowerCase();
        if (lower.includes('bebida')) return 'coffee';
        if (lower.includes('comida') || lower.includes('plato')) return 'utensils-crosshair';
        if (lower.includes('postre')) return 'pie-chart';
        if (lower.includes('entrada')) return 'soup';
        if (lower.includes('pizza')) return 'pizza';
        if (lower.includes('hamburguesa')) return 'sandwich';
        return 'tag';
    }

    getCategoryColor(name: string): string {
        const colors = [
            'text-blue-600 bg-blue-50',
            'text-emerald-600 bg-emerald-50',
            'text-amber-600 bg-amber-50',
            'text-rose-600 bg-rose-50',
            'text-indigo-600 bg-indigo-50',
            'text-violet-600 bg-violet-50',
            'text-cyan-600 bg-cyan-50'
        ];
        // Simple hash based on name
        const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }

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
        this.isSaving.set(false);
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

        request$.pipe(
            finalize(() => this.isSaving.set(false))
        ).subscribe({
            next: () => {
                this.catalogueService.loadCatalogue();
                this.closeModal();
            },
            error: (err) => {
                console.error('Error saving category', err);
                alert('Ocurrió un error al guardar la categoría.');
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
