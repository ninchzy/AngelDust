import { Router } from 'express';
import { pool } from './db.js';
import { HttpError } from './errors.js';

export const PROMO_ACTIVE_SQL =
    'is_active = 1 AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())';

export const toPromo = row => ({ code: row.code, rate: row.discount_percent / 100, scope: row.scope });

export async function findActivePromo(code, db = pool) {
    const [rows] = await db.execute(
        `SELECT code, discount_percent, scope FROM promo_codes WHERE code = ? AND ${PROMO_ACTIVE_SQL}`,
        [String(code || '').trim().toUpperCase()]
    );
    return rows[0] ? toPromo(rows[0]) : null;
}

export const catalogRouter = Router();

// Everything the storefront needs in one request.
catalogRouter.get('/catalog', async (req, res) => {
    const [categories] = await pool.query('SELECT slug, label FROM categories ORDER BY sort_order, id');
    const [products] = await pool.query(
        `SELECT p.id, p.slug, p.name, p.description, p.price_cents, p.tag, p.sizes, p.is_dark, c.slug AS category
         FROM products p JOIN categories c ON c.id = p.category_id
         WHERE p.is_active = 1
         ORDER BY p.sort_order, p.id`
    );
    const [variants] = await pool.query('SELECT id, product_id, name, swatch_hex, is_dark FROM product_variants ORDER BY sort_order, id');
    const [images] = await pool.query('SELECT product_id, variant_id, url, alt_text FROM product_images ORDER BY sort_order, id');
    const [promos] = await pool.query(
        `SELECT code, discount_percent, scope FROM promo_codes WHERE is_advertised = 1 AND ${PROMO_ACTIVE_SQL}`
    );

    res.json({
        categories: [{ id: 'all', label: 'All pieces' }, ...categories.map(c => ({ id: c.slug, label: c.label }))],
        products: products.map(p => {
            const own = variants
                .filter(v => v.product_id === p.id)
                .map(v => ({ id: v.id, name: v.name, color: v.swatch_hex, dark: !!v.is_dark }));
            return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                description: p.description || '',
                price: p.price_cents / 100,
                category: p.category,
                tag: p.tag,
                sizes: p.sizes.split(',').map(s => s.trim()).filter(Boolean),
                dark: own.some(v => v.dark),   // has at least one dark colour → on the dark-edit page
                // in display order; variantId says which colour the photo shows
                images: images
                    .filter(i => i.product_id === p.id)
                    .map(i => ({ url: i.url, alt: i.alt_text, variantId: i.variant_id })),
                variants: own,
            };
        }),
        promos: promos.map(toPromo),
    });
});

catalogRouter.get('/promos/:code', async (req, res) => {
    const promo = await findActivePromo(req.params.code);
    if (!promo) throw new HttpError(404, 'Hmm, that code doesn\'t seem to work.');
    res.json({ promo });
});
