import { Component, computed, inject, signal } from '@angular/core';
import { CatalogueService } from '../../../core/services/catalogue.service';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  templateUrl: './category-filter.component.html',
  styleUrl: './category-filter.component.css'
})
export class CategoryFilterComponent {
  catalogueService = inject(CatalogueService);

  // Using the centralized signal from CatalogueService instead of local isolated state
  selectCategory(id: number | null) {
    this.catalogueService.setActiveCategory(id);
  }
}
