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

  onProductSelected(product: any) {
    this.cartService.addItem(product);
  }

  onOrderProcessed() {
    // When the order is paid or saved
    this.tableService.clearSelection();
  }
}

