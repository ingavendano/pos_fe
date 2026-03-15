import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductRecipe } from '../api/model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class RecipeService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private readonly API_URL = `${environment.apiUrl}/recipes`;

    getRecipesByProduct(productId: number) {
        return this.http.get<ProductRecipe[]>(`${this.API_URL}/product/${productId}`);
    }

    addIngredient(productId: number, ingredientId: number, quantity: number) {
        const tenantId = this.auth.currentUser()?.tenantId;
        return this.http.post<ProductRecipe>(
            `${this.API_URL}/product/${productId}/ingredient/${ingredientId}?quantity=${quantity}&tenantId=${tenantId}`, 
            {}
        );
    }

    removeIngredient(recipeId: number) {
        return this.http.delete<void>(`${this.API_URL}/${recipeId}`);
    }
}
