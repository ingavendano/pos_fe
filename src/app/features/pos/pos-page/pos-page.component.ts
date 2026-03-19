import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryFilterComponent } from '../category-filter/category-filter.component';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { OrderTicketComponent } from '../order-ticket/order-ticket.component';
import { TablesGridComponent } from '../tables-grid/tables-grid.component';
import { CatalogueService } from '../../../core/services/catalogue.service';
import { CartService } from '../../../core/services/cart.service';
import { TableService } from '../../../core/services/table.service';

@Component({
  selector: 'app-pos-page',
  standalone: true,
  imports: [
    CommonModule,
    CategoryFilterComponent,
    ProductGridComponent,
    OrderTicketComponent,
    TablesGridComponent
  ],
  templateUrl: './pos-page.component.html'
})
export class PosPageComponent implements OnInit {
  // Inject services
  catalogueService = inject(CatalogueService);
  cartService = inject(CartService);
  tableService = inject(TableService);

  ngOnInit() {
    this.tableService.loadTables();
  }

  onProductSelected(selection: { product: any, event: MouseEvent }) {
    const { product, event } = selection;
    this.cartService.addItem(product);
    this.animateFlyToCart(event);
  }

  private animateFlyToCart(event: MouseEvent) {
    const flyer = document.createElement('div');
    flyer.className = 'animate-fly bg-indigo-500 w-6 h-6';
    
    // Find target (order ticket panel)
    const target = document.querySelector('app-order-ticket');
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const targetX = targetRect.left + (targetRect.width / 2) - event.clientX;
    const targetY = targetRect.top + (targetRect.height / 2) - event.clientY;

    flyer.style.left = `${event.clientX - 12}px`;
    flyer.style.top = `${event.clientY - 12}px`;
    flyer.style.setProperty('--target-x', `${targetX}px`);
    flyer.style.setProperty('--target-y', `${targetY}px`);

    document.body.appendChild(flyer);

    flyer.addEventListener('animationend', () => {
      flyer.remove();
    });
  }

  onOrderProcessed() {
    // When the order is paid or saved
    this.tableService.clearSelection();
  }
}

