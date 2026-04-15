import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private platformId = inject(PLATFORM_ID);

  /** Desktop: sidebar collapse state */
  isCollapsed = signal(false);

  /** Mobile: drawer open/close state */
  isMobileOpen = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Auto-collapse on small screens at startup
      this.isCollapsed.set(window.innerWidth < 768);
    }
  }

  toggle() {
    this.isCollapsed.update(v => !v);
  }

  setCollapsed(value: boolean) {
    this.isCollapsed.set(value);
  }

  openMobile() {
    this.isMobileOpen.set(true);
  }

  closeMobile() {
    this.isMobileOpen.set(false);
  }

  toggleMobile() {
    this.isMobileOpen.update(v => !v);
  }
}
