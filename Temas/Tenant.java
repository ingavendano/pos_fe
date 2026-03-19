package com.restaurante.backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String domain;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(nullable = false, length = 5, name = "currency_symbol")
    @Builder.Default
    private String currencySymbol = "$";

    @Column(length = 30)
    private String nit;

    @Column(length = 30)
    private String nrc;

    @Column(length = 200)
    private String giro;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Tema visual del tenant.
     * Valores posibles: indigo | restaurant | retail | premium
     * Se aplica como clase CSS en el <body> del frontend.
     */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String theme = "indigo";

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
