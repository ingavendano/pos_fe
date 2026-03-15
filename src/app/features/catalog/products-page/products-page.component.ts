import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { Product, Category } from '../../../core/api/model';
import { RecipeManagementComponent } from '../recipe-management/recipe-management.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, RecipeManagementComponent],
  templateUrl: './products-page.component.html'
})
export default class ProductsPageComponent implements OnInit {
  catalogueService = inject(CatalogueService);
  authService = inject(AuthService);

  searchTerm = signal('');
  filterCategoryId = signal<number | null>(null);

  // Modal state
  isModalOpen = signal(false);
  isSaving = signal(false);
  editingProduct = signal<Product | null>(null);

  // Restock state
  isRestockModalOpen = signal(false);
  restockingProduct = signal<Product | null>(null);
  restockQuantity = 0;

  // Recipe modal state
  isRecipeModalOpen = signal(false);
  recipeTargetProduct = signal<Product | null>(null);

  productForm = {
    name: '',
    description: '',
    price: 0,
    categoryId: null as number | null,
    isAvailable: true,
    quantity: 0,
    minStock: 0,
    imageUrl: '',
    isSellable: true
  };

  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const filterCatId = this.filterCategoryId();

    // First apply category filter
    let products = this.catalogueService.getProductsByCategory(filterCatId);

    // Then apply text search
    if (term) {
      products = products.filter(p =>
        (p.name || '').toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.id?.toString() || '').includes(term)
      );
    }

    return products;
  });

  ngOnInit() {
    this.catalogueService.loadCatalogue();
  }

  getCategoryName(id: number): string {
    const cat = this.catalogueService.getCategories().find(c => c.id === id);
    return cat ? (cat.name ?? 'Unknown') : 'Unknown';
  }

  isFormValid(): boolean {
    return !!this.productForm.name &&
      this.productForm.price >= 0 &&
      this.productForm.categoryId !== null &&
      this.productForm.quantity !== null && this.productForm.quantity >= 0 &&
      this.productForm.minStock !== null && this.productForm.minStock >= 0;
  }

  openModal(product: Product | null = null) {
    this.editingProduct.set(product);
    if (product) {
      this.productForm = {
        name: product.name ?? '',
        description: product.description ?? '',
        price: product.price ?? 0,
        categoryId: product.category?.id ?? null,
        isAvailable: product.isAvailable ?? true,
        quantity: product.quantity ?? 0,
        minStock: product.minStock ?? 0,
        imageUrl: product.imageUrl ?? '',
        isSellable: product.isSellable ?? true
      };
    } else {
      this.productForm = {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        isAvailable: true,
        quantity: 0,
        minStock: 0,
        imageUrl: '',
        isSellable: true
      };
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.editingProduct.set(null);
  }

  saveProduct() {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);

    const payload: Partial<Product> = {
      name: this.productForm.name,
      description: this.productForm.description,
      price: this.productForm.price,
      category: { id: this.productForm.categoryId! },
      isAvailable: this.productForm.isAvailable,
      quantity: this.productForm.quantity,
      minStock: this.productForm.minStock,
      imageUrl: this.productForm.imageUrl || undefined,
      isSellable: this.productForm.isSellable
    };

    const request$ = this.editingProduct()?.id
      ? this.catalogueService.updateProduct(this.editingProduct()!.id!, payload)
      : this.catalogueService.createProduct(this.productForm.categoryId!, payload);

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
        console.error('Error saving product', err);
        alert('Ocurrió un error al guardar el producto.');
      },
      complete: () => {
        this.isSaving.set(false);
      }
    });
  }

  deleteProduct(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Podría fallar si está en órdenes activas.')) {
      return;
    }

    this.catalogueService.deleteProduct(id).subscribe({
      next: () => {
        this.catalogueService.loadCatalogue();
      },
      error: (err) => {
        console.error('Error deleting product', err);
        alert('No se pudo eliminar el producto. Quizás esté asignado a órdenes existentes.');
      }
    });
  }

  // --- Restock Logic ---
  openRestockModal(product: Product) {
    this.restockingProduct.set(product);
    this.restockQuantity = 0;
    this.isRestockModalOpen.set(true);
  }

  closeRestockModal() {
    this.isRestockModalOpen.set(false);
    this.restockingProduct.set(null);
    this.restockQuantity = 0;
  }

  saveRestock() {
    const product = this.restockingProduct();
    if (!product || this.restockQuantity <= 0) return;

    this.isSaving.set(true);
    this.catalogueService.restockProduct(product.id || 0, this.restockQuantity).subscribe({
      next: () => {
        this.catalogueService.loadCatalogue();
        this.closeRestockModal();
      },
      error: (err) => {
        console.error('Error restocking product', err);
        alert('Ocurrió un error al reabastecer el producto.');
      },
      complete: () => {
        this.isSaving.set(false);
      }
    });
  }

  // --- Recipe Logic ---
  openRecipeModal(product: Product) {
    this.recipeTargetProduct.set(product);
    this.isRecipeModalOpen.set(true);
  }

  closeRecipeModal() {
    this.isRecipeModalOpen.set(false);
    this.recipeTargetProduct.set(null);
  }
}
