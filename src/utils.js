import { FREE_SHIPPING_FROM, GIFT_WRAP_COST, SHIPPING_COST } from './config.js';

export const money = n => '$' + n.toFixed(2);
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const firstName = name => String(name || '').trim().split(/\s+/)[0];

// Photos of one colour, in order (falls back to all of the product's photos).
export function photosFor(product, variantId) {
    const own = product.images.filter(i => i.variantId === variantId);
    return own.length ? own : product.images;
}

// The 480px copy that `npm run photos` makes next to every product photo (for cards, thumbnails, cart).
export const smallPhoto = url => url.replace(/\.webp$/, '-480.webp');

// srcset for product photos: the browser picks the 480px or 960px file for the space it has.
export const photoSrcSet = url => `${smallPhoto(url)} 480w, ${url} 960w`;

// Products that come in one size don't ask the shopper to pick one.
export const isOneSize = product => product.sizes.length <= 1;

export const sizeLabel = size => (size && size !== 'One size' ? `Size ${size}` : 'One size');

// Does a promo discount this product in this colour? ("dark" codes only count dark colours.)
// Without a colour it asks: does it discount any colour of this product?
export function promoApplies(promo, product, variantId) {
    if (!promo || !product) return false;
    if (promo.scope === 'all') return true;
    if (promo.scope !== 'dark') return false;
    if (variantId == null) return product.dark;
    return !!product.variants.find(v => v.id === variantId)?.dark;
}

export const darkVariants = product => product.variants.filter(v => v.dark);

export const discountedPrice = (price, rate) => Math.round(price * 100 * (1 - rate)) / 100;

// Prices for one cart line. The promo comes off each piece (same price as on the promo page),
// then is multiplied by the quantity.
export function linePrices(line, product, promo) {
    const discounted = promoApplies(promo, product, line.variantId);
    const unit = discounted ? discountedPrice(product.price, promo.rate) : product.price;
    return {
        discounted,
        unitOriginal: product.price,
        unit,
        totalOriginal: product.price * line.qty,
        total: unit * line.qty,
    };
}

export function cartTotals(cart, extras, productById) {
    let subtotal = 0;
    let discount = 0;
    for (const line of cart) {
        const p = productById(line.productId);
        if (!p) continue;
        const prices = linePrices(line, p, extras.promo);
        subtotal += prices.totalOriginal;
        discount += prices.totalOriginal - prices.total;
    }
    discount = Math.round(discount * 100) / 100;
    // free shipping is earned on what the pieces actually cost after the promo code
    const itemsTotal = subtotal - discount;
    const shipping = itemsTotal >= FREE_SHIPPING_FROM || subtotal === 0 ? 0 : SHIPPING_COST;
    const gift = extras.giftWrap ? GIFT_WRAP_COST : 0;
    return { subtotal, discount, itemsTotal, shipping, gift, total: itemsTotal + shipping + gift };
}

export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}

// crypto.randomUUID only exists on https/localhost, so fall back for plain-http testing.
export function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
