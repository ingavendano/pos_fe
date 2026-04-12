import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Category, Product } from '../api/model';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CatalogueService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    categories = signal<Category[]>([]);
    products = signal<Product[]>([]);

    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);

    private readonly API_URL = `${environment.apiUrl}`;

    // Products categorized by category id
    productsByCategory = computed(() => {
        const map = new Map<number, Product[]>();
        this.categories().forEach(cat => map.set(cat.id!, []));

        this.products().forEach(product => {
            const keyId = product.category?.id || 0;
            const items = map.get(keyId) || [];
            items.push(product);
            map.set(keyId, items);
        });
        return map;
    });

    // Current active category (null means all)
    activeCategoryId = signal<number | null>(null);

    // Derives products based on current active category and sellable status
    filteredProducts = computed(() => {
        const active = this.activeCategoryId();
        const allProducts = this.products().filter(p => p.isSellable !== false);
        
        if (active === null) {
            return allProducts;
        }
        
        return allProducts.filter(p => p.category?.id === active);
    });

    constructor() {
        this.loadCatalogue();
    }

    loadCatalogue() {
        const currentUser = this.authService.currentUser();
        if (!currentUser || !currentUser.tenantId) {
            this.error.set('No se encontró información del tenant para el usuario actual.');
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        forkJoin({
            categories: this.http.get<Category[]>(`${this.API_URL}/categories/tenant/${currentUser.tenantId}`),
            products: this.http.get<Product[]>(`${this.API_URL}/products/tenant/${currentUser.tenantId}`)
        }).pipe(
            finalize(() => this.isLoading.set(false))
        ).subscribe({
            next: (data) => {
                this.categories.set(data.categories);

                const mappedProducts = data.products.map(p => ({
                    ...p,
                    category: p.category || (p.categoryId ? { id: p.categoryId, name: (p as any).categoryName } : undefined)
                }));
                this.products.set(mappedProducts);
            },
            error: (err) => {
                console.error('Error fetching catalogue', err);
                this.error.set('Error al cargar el catálogo de productos.');
            }
        });
    }

    getCategories() {
        return this.categories();
    }

    getProductsByCategory(categoryId: number | null) {
        if (!categoryId) return this.products();
        // Filter by product.category.id
        return this.products().filter(p => p.category?.id === categoryId);
    }

    setActiveCategory(id: number | null) {
        this.activeCategoryId.set(id);
    }

    // --- Admin CRUD Operations ---

    createCategory(category: Partial<Category>) {
        const currentUser = this.authService.currentUser();
        if (!currentUser?.tenantId) return;

        return this.http.post<Category>(`${this.API_URL}/categories/tenant/${currentUser.tenantId}`, category);
    }

    updateCategory(id: number, category: Partial<Category>) {
        return this.http.put<Category>(`${this.API_URL}/categories/${id}`, category);
    }

    deleteCategory(id: number) {
        return this.http.delete<void>(`${this.API_URL}/categories/${id}`);
    }

    createProduct(categoryId: number, product: Partial<Product>) {
        const currentUser = this.authService.currentUser();
        if (!currentUser?.tenantId) return;

        // Ensure the product payload includes the category ID correctly, potentially nested
        const productPayload = {
            ...product,
            category: product.category ? { ...product.category, id: categoryId } : { id: categoryId }
        };

        return this.http.post<Product>(`${this.API_URL}/products/tenant/${currentUser.tenantId}/category/${categoryId}`, productPayload);
    }

    updateProduct(id: number, product: Partial<Product>) {
        const categoryId = product.category?.id;
        let url = `${this.API_URL}/products/${id}`;
        if (categoryId) {
            url += `?categoryId=${categoryId}`;
        }
        
        // Also ensure it's in the body for the fallback logic we just added to the backend
        const productPayload: any = { 
            ...product,
            categoryId: categoryId 
        };
        return this.http.put<Product>(url, productPayload);
    }

    deleteProduct(id: number) {
        return this.http.delete<void>(`${this.API_URL}/products/${id}`);
    }

    restockProduct(id: number, quantityToAdd: number) {
        return this.http.patch<Product>(`${this.API_URL}/products/${id}/restock?quantityToAdd=${quantityToAdd}`, {});
    }
}
