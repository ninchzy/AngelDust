-- ==========================================================
-- Starter catalogue for Angel Dust. Safe to re-run: existing rows
-- are updated, nothing is duplicated, customer data is untouched.
-- Product photos are added separately with `npm run photos`.
-- ==========================================================

INSERT INTO categories (id, slug, label, sort_order) VALUES
    (1, 'dresses',     'Dresses',        1),
    (2, 'sets',        'Sets',           2),
    (3, 'tops',        'Blouses & Tops', 3),
    (4, 'skirts',      'Skirts',         4),
    (5, 'accessories', 'Accessories',    5)
ON DUPLICATE KEY UPDATE slug = VALUES(slug), label = VALUES(label), sort_order = VALUES(sort_order);

INSERT INTO products (id, slug, name, price_cents, category_id, tag, sizes, is_dark, sort_order, description) VALUES
    (1,  'gothic-lace-square-neck-set', 'Gothic Lace Square Neck Dress and Top Two Pieces Set', 3299, 2, 'Bestseller', 'XS,S,M,L,XL', 1, 1,
     'A midnight-navy corset jumper skirt with a tiered lace hem, paired with a black off-shoulder top with dramatic bell sleeves. Wear them together for a full gothic look, or style each piece on its own.'),
    (2,  'strawberry-milk-ruffle-dress', 'Strawberry Milk Ruffle Tiered Dress', 4500, 1, 'New', 'XS,S,M,L,XL', 0, 2,
     'Sweet as a strawberry milkshake: a pink-and-cream jumper skirt with heart-shaped bib details, satin bows and three tiers of ruffles that bounce with every step.'),
    (3,  'cherry-blossom-puff-blouse', 'Cherry Blossom Puff Sleeve Blouse', 2850, 3, NULL, 'XS,S,M,L,XL', 0, 3,
     'A snow-white blouse with a ruffled jabot, layered lace cuffs and soft puff sleeves. The perfect base for any jumper skirt — elegant on its own, dreamy under a corset.'),
    (4,  'velvet-bow-petticoat-skirt', 'Velvet Bow Tiered Petticoat Skirt', 3400, 4, NULL, 'XS,S,M,L,XL', 1, 4,
     'A full, tiered skirt with a built-in petticoat for that perfect bell shape, finished with a velvet bow at the waist. Comes in classic raven black and a deep wine-violet.'),
    (5,  'sweet-lace-ribbon-headdress', 'Sweet Lace Ribbon Headdress', 1499, 5, NULL, 'One size', 0, 5,
     'A gathered lace headdress with long satin ribbons and a big bow — the finishing touch every lolita outfit deserves. Ties easily and sits comfortably all day.'),
    (6,  'teatime-peter-pan-blouse', 'Teatime Peter Pan Collar Blouse', 2600, 3, 'New', 'XS,S,M,L,XL', 0, 6,
     'A gentle blouse with a rounded Peter Pan collar, pintucked front and ruffled cuffs. Made for tea parties, picnics and every soft afternoon in between.'),
    (7,  'rose-garden-jumper-skirt', 'Rose Garden Jumper Skirt with Lace Trim', 5800, 1, NULL, 'XS,S,M,L,XL', 0, 7,
     'A classic jumper skirt covered in blush rose print, with a ruffled square neckline, lace-trimmed tiers and a sash that ties into a big bow at the back.'),
    (8,  'lace-trim-knee-socks', 'Lace-Trim Over-the-Knee Socks', 999, 5, NULL, 'One size', 0, 8,
     'Soft over-the-knee socks topped with a ruffle of lace and a tiny ribbon bow. Stretchy and comfortable, they peek out perfectly under any petticoat.'),
    (9,  'moonlit-corset-ruffle-skirt', 'Moonlit Corset Waist Ruffle Skirt', 3900, 4, 'Limited', 'XS,S,M,L,XL', 1, 9,
     'A high-waisted skirt with a boned corset waist and a high-low ruffled hem that swirls like moonlit water. Lace-up details let you adjust the fit.'),
    (10, 'bunny-ears-heart-bag', 'Bunny Ears Heart Shoulder Bag', 2400, 5, NULL, 'One size', 0, 10,
     'A quilted heart-shaped bag with a frilled edge and a detachable shoulder strap. Roomy enough for your phone, keys and a little lipstick.'),
    (11, 'raspberry-bow-cardigan', 'Raspberry Bow Knit Cardigan', 3600, 3, NULL, 'XS,S,M,L,XL', 0, 11,
     'A cosy knit cardigan with a lace collar and detachable ribbon bows down the front. Throw it over a jumper skirt when the evening gets chilly.'),
    (12, 'porcelain-doll-set', 'Porcelain Doll Blouse and Skirt Set', 5200, 2, NULL, 'XS,S,M,L,XL', 0, 12,
     'Look like a porcelain doll come to life: a tiered skirt dress edged with polka-dot lace, paired with a matching blouse. Choose dreamy pink or striking black.'),
    (13, 'midnight-rose-gothic-dress', 'Midnight Rose Gothic Lace Dress', 6200, 1, 'New', 'XS,S,M,L,XL', 1, 13,
     'A gothic jumper skirt layered with sheer rose lace, ruffled tiers and a corset-style bodice. In pure black, or black with wine-red accents.'),
    (14, 'raven-lace-cross-choker', 'Raven Lace Cross Choker', 1250, 5, NULL, 'One size', 1, 14,
     'A soft black choker with a silver cross charm and an adjustable chain closure — the little gothic detail that pulls an outfit together.'),
    (15, 'black-velvet-bow-bonnet', 'Black Velvet Bow Bonnet', 1999, 5, NULL, 'One size', 1, 15,
     'A lace bonnet framed with ruffles and finished with long ribbon bows that tie under the chin. Choose black bows or deep midnight-navy ones.')
ON DUPLICATE KEY UPDATE
    slug = VALUES(slug), name = VALUES(name), price_cents = VALUES(price_cents), category_id = VALUES(category_id),
    tag = VALUES(tag), sizes = VALUES(sizes), is_dark = VALUES(is_dark), sort_order = VALUES(sort_order),
    description = VALUES(description);

-- Colours we have photos for (the "style bubbles"). is_dark = 1 → part of the dark edit (BLACKLACE10).
INSERT INTO product_variants (product_id, name, swatch_hex, is_dark, stock, sort_order) VALUES
    (1,  'Midnight Navy', '#2c3557', 1, 25, 1),
    (2,  'Strawberry',    '#F4A6B8', 0, 25, 1),
    (3,  'Snow White',    '#FBF8F2', 0, 25, 1),
    (4,  'Raven Black',   '#1f1a1c', 1, 25, 1), (4,  'Wine',          '#4E2C5C', 1, 25, 2),
    (5,  'Black',         '#1f1a1c', 1, 25, 1), (5,  'Ivory',         '#F5EEDC', 0, 25, 2), (5, 'Pink', '#F4B6C6', 0, 25, 3),
    (6,  'Cream',         '#F3E9D2', 0, 25, 1), (6,  'Sky',           '#BFD4EA', 0, 25, 2),
    (7,  'Rose',          '#EBB4BE', 0, 25, 1),
    (8,  'White',         '#FBF8F2', 0, 25, 1), (8,  'Black',         '#1f1a1c', 1, 25, 2), (8, 'Pink', '#F4C6D2', 0, 25, 3),
    (9,  'Raven Black',   '#1f1a1c', 1, 25, 1), (9,  'Midnight Navy', '#2c3557', 1, 25, 2),
    (10, 'Milk',          '#F5F1E6', 0, 25, 1), (10, 'Raspberry',     '#C8102E', 0, 25, 2),
    (11, 'Raspberry',     '#A3142E', 0, 25, 1), (11, 'Cream',         '#F3E9D2', 0, 25, 2),
    (12, 'Ivory & Pink',  '#F6D5DC', 0, 25, 1), (12, 'Ivory & Black', '#3a2e30', 1, 25, 2),
    (13, 'Raven Black',   '#1f1a1c', 1, 25, 1), (13, 'Wine',          '#6E1F35', 1, 25, 2),
    (14, 'Black',         '#1f1a1c', 1, 25, 1),
    (15, 'Raven Black',   '#1f1a1c', 1, 25, 1), (15, 'Midnight Navy', '#2c3557', 1, 25, 2)
ON DUPLICATE KEY UPDATE swatch_hex = VALUES(swatch_hex), is_dark = VALUES(is_dark), sort_order = VALUES(sort_order);

-- Colours removed because no photos exist for them.
DELETE FROM product_variants WHERE (product_id, name) IN (
    (1, 'Raven Black'), (2, 'Cream'), (3, 'Blush'), (4, 'Dusty Rose'), (7, 'Mint')
);

INSERT INTO promo_codes (code, description, discount_percent, scope, is_advertised) VALUES
    ('SWEET10',     '10% off your first order',     10.00, 'all',  1),
    ('BLACKLACE10', '15% off all dark garments',    15.00, 'dark', 1)
ON DUPLICATE KEY UPDATE description = VALUES(description), discount_percent = VALUES(discount_percent),
    scope = VALUES(scope), is_advertised = VALUES(is_advertised);
