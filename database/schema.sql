-- ==========================================================
-- Angel Dust · sweet lolita atelier — MySQL 8 schema
--
-- Run with `npm run db:setup` (creates the database named in .env,
-- then runs this file and seed.sql), or paste it into MySQL Workbench
-- after `CREATE DATABASE angel_dust; USE angel_dust;`.
-- Safe to re-run: nothing is dropped.
-- ==========================================================

-- ---------- Catalogue ----------

CREATE TABLE IF NOT EXISTS categories (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(40)  NOT NULL UNIQUE,
    label       VARCHAR(80)  NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug         VARCHAR(120) NOT NULL UNIQUE,
    name         VARCHAR(160) NOT NULL,
    description  TEXT         NULL,
    price_cents  INT UNSIGNED NOT NULL,
    category_id  INT UNSIGNED NOT NULL,
    tag          VARCHAR(30)  NULL,                 -- "New", "Bestseller", …
    sizes        VARCHAR(100) NOT NULL DEFAULT 'XS,S,M,L,XL',  -- comma-separated, or 'One size'
    is_dark      TINYINT(1)   NOT NULL DEFAULT 0,   -- (old, unused: darkness is per colour now, see product_variants)
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,   -- hide without deleting
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id),
    INDEX idx_products_listing (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The "style bubbles" on a product card.
CREATE TABLE IF NOT EXISTS product_variants (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id  INT UNSIGNED NOT NULL,
    name        VARCHAR(60)  NOT NULL,
    swatch_hex  CHAR(7)      NOT NULL,
    is_dark     TINYINT(1)   NOT NULL DEFAULT 0,   -- dark colours get the dark-garment promo (BLACKLACE10)
    stock       INT UNSIGNED NOT NULL DEFAULT 0,
    sort_order  INT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    UNIQUE KEY uq_variant_name (product_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product photos, filled by `npm run photos` (see scripts/import-photos.mjs).
-- Each photo belongs to one colour (variant_id); sort_order 1 is that colour's card photo.
CREATE TABLE IF NOT EXISTS product_images (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id  INT UNSIGNED NOT NULL,
    variant_id  INT UNSIGNED NULL,
    url         VARCHAR(500) NOT NULL,
    alt_text    VARCHAR(200) NOT NULL DEFAULT '',
    sort_order  INT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promo_codes (
    code              VARCHAR(30)  NOT NULL PRIMARY KEY,
    description       VARCHAR(200) NOT NULL DEFAULT '',
    discount_percent  DECIMAL(5,2) NOT NULL,
    scope             ENUM('all', 'dark') NOT NULL DEFAULT 'all',  -- which products it discounts
    is_advertised     TINYINT(1)   NOT NULL DEFAULT 0,             -- shown on the site (hero, sale page)
    is_active         TINYINT(1)   NOT NULL DEFAULT 1,
    starts_at         DATETIME     NULL,
    ends_at           DATETIME     NULL,
    CONSTRAINT chk_promo_percent CHECK (discount_percent > 0 AND discount_percent <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Accounts ----------

CREATE TABLE IF NOT EXISTS users (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,           -- bcrypt
    display_name   VARCHAR(80)  NOT NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login sessions. Only a SHA-256 hash of the cookie token is stored.
CREATE TABLE IF NOT EXISTS sessions (
    token_hash  CHAR(64)     NOT NULL PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME     NOT NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Favourites + collections ----------

CREATE TABLE IF NOT EXISTS favourites (
    user_id     INT UNSIGNED NOT NULL,
    product_id  INT UNSIGNED NOT NULL,
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, product_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-named groups inside favourites. The id is a UUID made by the browser.
CREATE TABLE IF NOT EXISTS collections (
    id          CHAR(36)     NOT NULL PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    name        VARCHAR(40)  NOT NULL,
    created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_collections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_collections_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collection_items (
    collection_id  CHAR(36)     NOT NULL,
    product_id     INT UNSIGNED NOT NULL,
    added_at       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (collection_id, product_id),
    CONSTRAINT fk_ci_collection FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Cart (logged-in users; guests keep theirs in the browser) ----------

CREATE TABLE IF NOT EXISTS carts (
    user_id     INT UNSIGNED NOT NULL PRIMARY KEY,
    promo_code  VARCHAR(30)  NULL,
    gift_wrap   TINYINT(1)   NOT NULL DEFAULT 0,
    gift_note   VARCHAR(200) NOT NULL DEFAULT '',
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_carts_promo FOREIGN KEY (promo_code) REFERENCES promo_codes (code) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
    user_id     INT UNSIGNED     NOT NULL,
    variant_id  INT UNSIGNED     NOT NULL,
    size        VARCHAR(12)      NOT NULL DEFAULT '',
    quantity    TINYINT UNSIGNED NOT NULL,
    added_at    DATETIME(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (user_id, variant_id, size),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (user_id) REFERENCES carts (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_qty CHECK (quantity BETWEEN 1 AND 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Orders (ready for when checkout/payments are built) ----------

CREATE TABLE IF NOT EXISTS orders (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id           INT UNSIGNED NULL,
    status            ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
    subtotal_cents    INT UNSIGNED NOT NULL,
    discount_cents    INT UNSIGNED NOT NULL DEFAULT 0,
    shipping_cents    INT UNSIGNED NOT NULL DEFAULT 0,
    gift_wrap_cents   INT UNSIGNED NOT NULL DEFAULT 0,
    total_cents       INT UNSIGNED NOT NULL,
    promo_code        VARCHAR(30)  NULL,               -- copied, not a FK, so history survives
    gift_note         VARCHAR(200) NOT NULL DEFAULT '',
    email             VARCHAR(255) NOT NULL,
    ship_name         VARCHAR(120) NOT NULL,
    ship_line1        VARCHAR(200) NOT NULL,
    ship_line2        VARCHAR(200) NOT NULL DEFAULT '',
    ship_city         VARCHAR(100) NOT NULL,
    ship_postal_code  VARCHAR(20)  NOT NULL,
    ship_country      CHAR(2)      NOT NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_orders_user (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Names and prices are copied at purchase time so old orders stay accurate.
CREATE TABLE IF NOT EXISTS order_items (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id          INT UNSIGNED NOT NULL,
    product_id        INT UNSIGNED NULL,
    variant_id        INT UNSIGNED NULL,
    product_name      VARCHAR(160) NOT NULL,
    variant_name      VARCHAR(60)  NOT NULL,
    size              VARCHAR(12)  NOT NULL DEFAULT '',
    unit_price_cents  INT UNSIGNED NOT NULL,
    discount_cents    INT UNSIGNED NOT NULL DEFAULT 0,
    quantity          TINYINT UNSIGNED NOT NULL,
    CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL,
    CONSTRAINT fk_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
