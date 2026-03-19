package com.restaurante.backend.service;

import com.restaurante.backend.dto.PublicTenantDto;

public interface TenantService {

    PublicTenantDto getPublicInfo(Long tenantId);

    PublicTenantDto updateTheme(Long tenantId, String theme);

    // ... tus métodos existentes aquí
}
