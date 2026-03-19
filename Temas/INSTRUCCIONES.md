# Sistema de Temas — Instrucciones de Integración

## Archivos incluidos

### Backend
- `V99__add_theme_to_tenants.sql` → Migración Flyway (renombra el número según tu secuencia)
- `Tenant.java`                   → Entidad actualizada con campo `theme`
- `PublicTenantDto.java`          → DTO público con campo `theme`
- `TenantController.java`         → Endpoint PATCH /api/tenants/theme
- `TenantService.java`            → Interface con método updateTheme
- `TenantServiceImpl.java`        → Implementación

### Frontend
- `themes.css`                    → Variables CSS de los 4 temas
- `theme.service.ts`              → Servicio para aplicar y guardar temas
- `theme-selector.component.ts`   → Componente selector visual
- `auth.service.patch.ts`         → Cambios puntuales en auth.service.ts

---

## Pasos de integración

### 1. Backend

Renombra la migración Flyway según tu secuencia actual:
```
V99__add_theme_to_tenants.sql → V{siguiente_numero}__add_theme_to_tenants.sql
```

Reemplaza tu `Tenant.java`, `PublicTenantDto.java` con los nuevos.
Agrega los métodos de `TenantService` y `TenantServiceImpl` a tus archivos existentes.
Agrega el endpoint `/theme` a tu `TenantController` existente.

---

### 2. Frontend

**a) Importa themes.css en styles.css:**
```css
@import 'tailwindcss';
@import './app/core/services/theme/themes.css';
```

**b) Copia los archivos a sus rutas:**
```
src/app/core/services/theme/themes.css
src/app/core/services/theme/theme.service.ts
src/app/features/admin/tenant-settings-page/theme-selector.component.ts
```

**c) Aplica los cambios en auth.service.ts:**
- Agrega `theme: string` a la interface `PublicTenantResponse`
- Inyecta `ThemeService` en el constructor
- En `loadTenantInfo()`, llama `this.themeService.applyTheme(info.theme)` al recibir la respuesta

**d) Usa las variables CSS en tus componentes:**

En lugar de clases hardcodeadas como `bg-indigo-600`, usa las variables:
```html
<!-- Antes -->
<button class="bg-indigo-600 hover:bg-indigo-700 text-white">

<!-- Después -->
<button style="background: var(--color-primary-600)" class="text-white hover:opacity-90">
```

Para el sidebar, reemplaza `bg-[#1E1B4B]` por:
```html
<aside style="background: var(--color-sidebar-bg)">
```

**e) Agrega el selector en tenant-settings-page:**
```typescript
import { ThemeSelectorComponent } from './theme-selector.component';

// En el template:
// <app-theme-selector></app-theme-selector>
```

---

### 3. Comportamiento esperado

1. Al cargar la app → `auth.service.ts` llama `/api/tenants/public/info`
2. El backend retorna `{ name, currency, theme: "restaurant" }`
3. `ThemeService.applyTheme("restaurant")` añade `class="theme-restaurant"` al `<body>`
4. Las variables CSS del tema activan automáticamente todos los colores
5. El admin puede cambiar el tema desde Ajustes → se guarda en DB y se aplica de inmediato

---

### 4. Preview instantáneo

El selector hace preview del tema al hacer clic, antes de guardar.
Si el usuario cancela o hay error al guardar, se revierte al tema anterior.
