import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaxService } from '../../core/services/tax.service';
import { NotificationService } from '../../core/services/notification.service';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { NotificationToastComponent } from '../notification-toast/notification-toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, NotificationToastComponent],
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent implements OnInit {
  private taxService = inject(TaxService);
  private notificationService = inject(NotificationService);

  ngOnInit() {
    // Load globally needed data when layout mounts
    this.taxService.loadTaxes();
    // Start SSE notification stream
    this.notificationService.connect();
  }
}
