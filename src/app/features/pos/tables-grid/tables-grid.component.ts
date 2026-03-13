import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableService } from '../../../core/services/table.service';
import { RestaurantTable } from '../../../core/api/model';
@Component({
  selector: 'app-tables-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables-grid.component.html',
  styleUrl: './tables-grid.component.css'
})
export class TablesGridComponent {
  tableService = inject(TableService);

  onTableClick(table: RestaurantTable) {
    if (table.status === 'AVAILABLE' || table.status === 'OCCUPIED') {
      this.tableService.selectTable(table);
    }
  }
}
