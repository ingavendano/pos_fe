package com.restaurante.backend.controller;

import com.restaurante.backend.dto.PublicTenantDto;
import com.restaurante.backend.security.TenantContext;
import com.restaurante.backend.service.TenantService;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    /**
     * GET /api/tenants/public/info
     * Público — no requiere autenticación.
     * Retorna nombre, moneda y tema del tenant identificado por el dominio.
     */
    @GetMapping("/public/info")
    public ResponseEntity<PublicTenantDto> getPublicInfo() {
        Long tenantId = TenantContext.getCurrentTenantId();
        if (tenantId == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tenantService.getPublicInfo(tenantId));
    }

    /**
     * PATCH /api/tenants/theme
     * Solo ADMIN — actualiza el tema visual del tenant actual.
     *
     * Body: { "theme": "restaurant" }
     * Temas válidos: indigo | restaurant | retail | premium
     */
    @PatchMapping("/theme")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PublicTenantDto> updateTheme(
            @RequestBody Map<String, @Pattern(regexp = "indigo|restaurant|retail|premium",
                    message = "Tema inválido. Use: indigo, restaurant, retail o premium") String> body) {

        String theme = body.get("theme");
        if (theme == null) {
            return ResponseEntity.badRequest().build();
        }

        Long tenantId = TenantContext.getCurrentTenantId();
        PublicTenantDto updated = tenantService.updateTheme(tenantId, theme);
        return ResponseEntity.ok(updated);
    }
}
