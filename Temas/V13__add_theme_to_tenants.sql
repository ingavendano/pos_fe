-- Agrega columna de tema a la tabla tenants
-- Temas disponibles: indigo | restaurant | retail | premium

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS theme VARCHAR(20) NOT NULL DEFAULT 'indigo';

-- Constraint para validar que solo se usen los temas definidos
ALTER TABLE tenants
    ADD CONSTRAINT tenants_theme_check
    CHECK (theme IN ('indigo', 'restaurant', 'retail', 'premium'));

-- Comentario descriptivo
COMMENT ON COLUMN tenants.theme IS
    'Tema visual del tenant. Valores: indigo (default), restaurant, retail, premium';
