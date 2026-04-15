import { Component, inject, OnInit, signal } from '@angular/core';
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
  catalogueService = inject(CatalogueService);
  cartService = inject(CartService);
  tableService = inject(TableService);

  /** Controls mobile tab: 'products' | 'ticket' */
  mobileView = signal<'products' | 'ticket'>('products');

  ngOnInit() {
    this.tableService.loadTables();
  }

  clearTable() {
    this.mobileView.set('products');
    this.tableService.clearSelection();
  }

  onProductSelected(selection: { product: any, event: MouseEvent }) {
    const { product, event } = selection;
    this.cartService.addItem(product);
    this.animateFlyToCart(event);
  }

  private animateFlyToCart(event: MouseEvent) {
    const flyer = document.createElement('div');
    flyer.className = 'animate-fly bg-indigo-500 w-6 h-6';

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
    flyer.addEventListener('animationend', () => flyer.remove());
  }

  onOrderProcessed() {
    this.mobileView.set('products');
    this.tableService.clearSelection();
  }
}

