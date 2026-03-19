package com.restaurante.backend.service.impl;

import com.restaurante.backend.domain.entity.Tenant;
import com.restaurante.backend.dto.PublicTenantDto;
import com.restaurante.backend.exception.ResourceNotFoundException;
import com.restaurante.backend.repository.TenantRepository;
import com.restaurante.backend.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;

    private static final String VALID_THEMES = "indigo|restaurant|retail|premium";

    @Override
    public PublicTenantDto getPublicInfo(Long tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant no encontrado"));

        return toPublicDto(tenant);
    }

    @Override
    @Transactional
    public PublicTenantDto updateTheme(Long tenantId, String theme) {
        if (!theme.matches(VALID_THEMES)) {
            throw new IllegalArgumentException(
                    "Tema inválido: " + theme + ". Use: indigo, restaurant, retail o premium");
        }

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant no encontrado"));

        tenant.setTheme(theme);
        tenantRepository.save(tenant);

        return toPublicDto(tenant);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private PublicTenantDto toPublicDto(Tenant tenant) {
        return PublicTenantDto.builder()
                .name(tenant.getName())
                .currency(tenant.getCurrency())
                .currencySymbol(tenant.getCurrencySymbol())
                .theme(tenant.getTheme())
                .build();
    }
}
