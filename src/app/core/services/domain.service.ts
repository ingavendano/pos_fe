import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DomainService {
  private readonly BASE_DOMAINS = ['localhost', 'tupos.vercel.app', 'vercel.app'];

  /**
   * Identifica si estamos en el dominio principal (Landing/Wizard)
   * o en el subdominio de un cliente.
   */
  isBaseDomain(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    
    // Exact match for base domains
    if (this.BASE_DOMAINS.includes(hostname)) {
      return true;
    }

    // IP addresses or direct OCI access should probably show landing or wizard
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIp) {
      return true;
    }

    return false;
  }

  /**
   * Extrae el slug del inquilino (tenant) del hostname actual.
   * Ejemplo: 'ventaloca.localhost' -> 'ventaloca'
   * Ejemplo: 'mitienda.tupos.vercel.app' -> 'mitienda'
   */
  getTenantSlug(): string | null {
    if (this.isBaseDomain()) {
      return null;
    }

    const hostname = window.location.hostname.toLowerCase();

    for (const base of this.BASE_DOMAINS) {
      if (hostname.endsWith('.' + base)) {
        const slug = hostname.substring(0, hostname.lastIndexOf('.' + base));
        // Handle cases like store.sub.domain.com -> we take the last part
        if (slug.includes('.')) {
          return slug.substring(slug.lastIndexOf('.') + 1);
        }
        return slug;
      }
    }

    // If no base domain matched but it's not a base domain itself (e.g. custom domain)
    // We treat the whole hostname as the tenant domain mapping
    return hostname;
  }

  getBaseUrl(): string {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    if (this.isBaseDomain()) {
        return `${protocol}//${hostname}${port}`;
    }

    // If it's a subdomain, try to find the base part
    for (const base of this.BASE_DOMAINS) {
        if (hostname.endsWith('.' + base)) {
            return `${protocol}//${base}${port}`;
        }
    }

    return `${protocol}//${hostname}${port}`;
  }
}
