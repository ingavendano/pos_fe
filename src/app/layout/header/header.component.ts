import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { SidebarService } from '../../core/services/sidebar.service';

@Component({
    selector: 'app-header',
    standalone: true,
    templateUrl: 'header.component.html'
})
export class HeaderComponent implements OnInit {
    authService = inject(AuthService);
    sidebarService = inject(SidebarService);
    private cashRegisterService = inject(CashRegisterService);

    registerIsOpen(): boolean {
        return this.cashRegisterService.status() === 'OPEN';
    }

    ngOnInit() {
        if (this.authService.isAuthenticated() && !this.authService.currentUser()?.branchName) {
            this.authService.logout();
            window.location.reload();
        }
    }
}
