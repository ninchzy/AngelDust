import { Router } from 'express';
import { pool, transaction } from './db.js';
import { findActivePromo } from './catalog.js';

const MAX_QTY = 10;

// Cleans a list of { variantId, size, qty } from the browser: whole numbers, qty 1–10,
// one line per colour + size.
function cleanItems(raw) {
    const lines = new Map();
    for (const item of Array.isArray(raw) ? raw : []) {
        const variantId = Number(item?.variantId);
        const size = String(item?.size ?? '').trim().slice(0, 12);
        const qty = Math.round(Number(item?.qty));
        if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isFinite(qty) || qty < 1) continue;
        const key = `${variantId}|${size}`;
        const prev = lines.get(key);
        lines.set(key, { variantId, size, qty: Math.min(MAX_QTY, (prev?.qty || 0) + qty) });
    }
    return [...lines.values()];
}

async function readCart(db, userId) {
    const [[cart]] = await db.execute('SELECT promo_code, gift_wrap, gift_note FROM carts WHERE user_id = ?', [userId]);
    const [items] = await db.execute(
        `SELECT ci.variant_id, ci.size, ci.quantity, v.product_id FROM cart_items ci
         JOIN product_variants v ON v.id = ci.variant_id
         JOIN products p ON p.id = v.product_id AND p.is_active = 1
         WHERE ci.user_id = ? ORDER BY ci.added_at, ci.variant_id`, [userId]
    );
    const promo = cart?.promo_code ? await findActivePromo(cart.promo_code, db) : null;
    return {
        items: items.map(i => ({ productId: i.product_id, variantId: i.variant_id, size: i.size, qty: i.quantity })),
        promo,
        giftWrap: !!cart?.gift_wrap,
        giftNote: cart?.gift_note || '',
    };
}

async function writeCart(db, userId, { items, promoCode, giftWrap, giftNote }) {
    const promo = promoCode ? await findActivePromo(promoCode, db) : null;
    await db.execute(
        `INSERT INTO carts (user_id, promo_code, gift_wrap, gift_note) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE promo_code = VALUES(promo_code), gift_wrap = VALUES(gift_wrap), gift_note = VALUES(gift_note)`,
        [userId, promo ? promo.code : null, giftWrap ? 1 : 0, String(giftNote || '').slice(0, 200)]
    );
    await db.execute('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    for (const { variantId, size, qty } of items) {
        // INSERT … SELECT silently skips colours that don't exist or sizes the product doesn't come in
        await db.execute(
            `INSERT INTO cart_items (user_id, variant_id, size, quantity)
             SELECT ?, v.id, ?, ? FROM product_variants v JOIN products p ON p.id = v.product_id
             WHERE v.id = ? AND FIND_IN_SET(?, p.sizes)`,
            [userId, size, qty, variantId, size]
        );
    }
}

// Mounted behind requireUser (see index.js). Guests keep their cart in the browser.
export const cartRouter = Router();

cartRouter.get('/cart', async (req, res) => {
    res.json(await readCart(pool, req.user.id));
});

// Replaces the whole cart with what the browser has.
cartRouter.put('/cart', async (req, res) => {
    const cart = await transaction(async db => {
        await writeCart(db, req.user.id, { ...req.body, items: cleanItems(req.body?.items) });
        return readCart(db, req.user.id);
    });
    res.json(cart);
});

// Called right after login: adds the guest cart on top of the saved one.
cartRouter.post('/cart/merge', async (req, res) => {
    const cart = await transaction(async db => {
        const saved = await readCart(db, req.user.id);
        const items = cleanItems([...saved.items, ...cleanItems(req.body?.items)]);
        await writeCart(db, req.user.id, {
            items,
            promoCode: saved.promo?.code || req.body?.promoCode,
            giftWrap: saved.giftWrap || !!req.body?.giftWrap,
            giftNote: saved.giftNote || req.body?.giftNote,
        });
        return readCart(db, req.user.id);
    });
    res.json(cart);
});
