package com.restaurante.backend.dto;

import lombok.*;

/**
 * DTO público del tenant — expuesto sin autenticación en GET /api/tenants/public/info
 * Lo usa el frontend para mostrar el nombre, moneda y aplicar el tema visual.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicTenantDto {

    private String name;
    private String currency;
    private String currencySymbol;

    /**
     * Tema visual: indigo | restaurant | retail | premium
     * El frontend lo aplica como clase CSS en el <body>.
     */
    private String theme;
}
