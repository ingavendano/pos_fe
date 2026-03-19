import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/api/model';
import { TenantService } from '../../../core/services/tenant.service';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-grid.component.html'
})
export class ProductGridComponent {
  tenantService = inject(TenantService);
  catalogueService = inject(CatalogueService);
  cartService = inject(CartService);

  // Use new Angular input() signal function
  products = input.required<Product[]>();
  productSelected = output<{ product: Product, event: MouseEvent }>();

  getAvailableStock(product: Product): number {
    const cartItem = this.cartService.items().find(item => item?.product?.id === product?.id);
    const inCartUnsaved = cartItem ? (cartItem.quantity - (cartItem.savedQuantity || 0)) : 0;

    // The backend stock (product.quantity) already has the saved quantity deducted
    const stock = product.quantity || 0;
    return stock - inCartUnsaved;
  }

  onProductSelect(product: Product, event: MouseEvent) {
    if (this.getAvailableStock(product) > 0) {
      this.productSelected.emit({ product, event });
    }
  }
}

