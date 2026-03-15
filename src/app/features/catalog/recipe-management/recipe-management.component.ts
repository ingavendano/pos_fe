import { Component, inject, input, output, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product, ProductRecipe } from '../../../core/api/model';
import { RecipeService } from '../../../core/services/recipe.service';
import { CatalogueService } from '../../../core/services/catalogue.service';

@Component({
  selector: 'app-recipe-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800">Ingredientes / Componentes</h3>
        <p class="text-xs text-gray-500">Define qué productos componen este elemento.</p>
      </div>

      <!-- Add Ingredient Search -->
      <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Añadir Componente</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <select [(ngModel)]="selectedIngredientId"
              class="w-full py-2 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
              <option [ngValue]="null" disabled>Seleccionar producto...</option>
              @for (p of availableIngredients(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }} ({{ p.quantity }} en stock)</option>
              }
            </select>
          </div>
          <input type="number" [(ngModel)]="newIngredientQuantity" placeholder="Cant."
            class="w-20 py-2 px-3 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <button (click)="addIngredient()" [disabled]="!selectedIngredientId || newIngredientQuantity <= 0"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            Añadir
          </button>
        </div>
      </div>

      <!-- Ingredient List -->
      <div class="overflow-hidden border border-gray-100 rounded-xl">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 text-gray-700 text-xs uppercase">
            <tr>
              <th class="px-4 py-3">Nombre</th>
              <th class="px-4 py-3">Cantidad</th>
              <th class="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (recipes().length === 0) {
              <tr>
                <td colspan="3" class="px-4 py-8 text-center text-gray-400 italic">
                  No se han definido ingredientes para este producto.
                </td>
              </tr>
            }
            @for (r of recipes(); track r.id) {
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-medium text-gray-700">{{ r.ingredient?.name }}</td>
                <td class="px-4 py-3 text-gray-600">{{ r.quantity }}</td>
                <td class="px-4 py-3 text-right">
                  <button (click)="removeIngredient(r.id!)" class="text-red-500 hover:text-red-700 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class RecipeManagementComponent implements OnInit {
  recipeService = inject(RecipeService);
  catalogueService = inject(CatalogueService);

  product = input.required<Product>();
  recipes = signal<ProductRecipe[]>([]);

  selectedIngredientId: number | null = null;
  newIngredientQuantity: number = 1;

  availableIngredients = computed(() => {
    // Filter out the current product to avoid self-reference (though database prevents it too)
    return this.catalogueService.products().filter(p => p.id !== this.product().id);
  });

  ngOnInit() {
    this.loadRecipes();
  }

  loadRecipes() {
    const productId = this.product().id;
    if (productId) {
      this.recipeService.getRecipesByProduct(productId).subscribe(data => {
        this.recipes.set(data);
      });
    }
  }

  addIngredient() {
    if (!this.selectedIngredientId || this.newIngredientQuantity <= 0) return;

    this.recipeService.addIngredient(
      this.product().id!,
      this.selectedIngredientId,
      this.newIngredientQuantity
    ).subscribe(() => {
      this.loadRecipes();
      this.selectedIngredientId = null;
      this.newIngredientQuantity = 1;
    });
  }

  removeIngredient(recipeId: number) {
    if (confirm('¿Deseas eliminar este ingrediente de la receta?')) {
      this.recipeService.removeIngredient(recipeId).subscribe(() => {
        this.loadRecipes();
      });
    }
  }
}
