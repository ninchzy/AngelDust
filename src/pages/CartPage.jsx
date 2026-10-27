import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { BagIcon } from '../components/Icons.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FREE_SHIPPING_FROM, GIFT_WRAP_COST, MAX_QTY } from '../config.js';
import { cartTotals, linePrices, money, photosFor, plural, promoApplies, sizeLabel } from '../utils.js';

const banner = (
    <section className="page-banner">
        <p className="eyebrow">Almost yours</p>
        <h1>Your Cart</h1>
        <p className="banner-text">Review your pieces, adjust quantities and add a little ribbon if it's a gift.</p>
    </section>
);

export default function CartPage() {
    const { cart, setCart, clearCart, favCount } = useShop();
    const { products } = useCatalog();
    const { toast } = useToast();
    // picked once, so the row doesn't reshuffle while adding things from it
    const [suggestions] = useState(() => products.filter(p => !cart.some(l => l.productId === p.id)).slice(0, 4));

    const onClear = () => {
        const snapshot = cart;
        clearCart();
        toast('Cart cleared', { label: 'Undo', fn: () => setCart(snapshot) });
    };

    return (
        <Layout banner={banner}>
            {cart.length ? (
                <div className="cart-layout">
                    <CartItems onClear={onClear} />
                    <Summary />
                </div>
            ) : (
                <EmptyState icon={<BagIcon />} title="Your cart is feeling a little empty" text="Let's find something sweet to fill it with.">
                    <Link className="btn btn-primary" to="/">Continue shopping</Link>
                    {favCount > 0 && <Link className="btn btn-ghost" to="/favourites">View favourites ({favCount})</Link>}
                </EmptyState>
            )}

            {suggestions.length > 0 && (
                <section className="suggestions">
                    <h2 className="section-title">You might also love</h2>
                    <div className="product-grid">
                        {suggestions.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}
        </Layout>
    );
}

function useTotals() {
    const { cart, cartExtras } = useShop();
    const { productById } = useCatalog();
    return cartTotals(cart, cartExtras, productById);
}

function CartItems({ onClear }) {
    const { cart, cartCount } = useShop();
    // counts the prices after any promo code
    const { itemsTotal, shipping } = useTotals();
    const progress = Math.min(100, itemsTotal / FREE_SHIPPING_FROM * 100);

    return (
        <section aria-labelledby="cart-title">
            <div className="cart-head">
                <div>
                    <h2 className="section-title" id="cart-title">Your pieces</h2>
                    <p className="muted">{plural(cartCount, 'item')}</p>
                </div>
                <button type="button" className="btn-link danger" onClick={onClear}>Clear cart</button>
            </div>

            <div className="ship-progress">
                {shipping === 0
                    ? 'Yay! Your order ships for free ♡'
                    : <>You're <strong>{money(FREE_SHIPPING_FROM - itemsTotal)}</strong> away from free shipping</>}
                <div className="ship-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progress to free shipping">
                    <span style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="cart-items">
                {cart.map(line => <CartLine key={line.key} line={line} />)}
            </div>
        </section>
    );
}

function CartLine({ line }) {
    const { cart, setCart, setQty, removeLine, addFav, cartExtras } = useShop();
    const { user, requireAuth } = useAuth();
    const { productById } = useCatalog();
    const { toast } = useToast();
    const [leaving, setLeaving] = useState(false);
    const [draft, setDraft] = useState(String(line.qty));
    const p = productById(line.productId);
    const v = p?.variants.find(x => x.id === line.variantId);
    const photo = p && photosFor(p, line.variantId)[0];
    const prices = p && linePrices(line, p, cartExtras.promo);

    useEffect(() => { setDraft(String(line.qty)); }, [line.qty]);

    if (!p || !v) return null;

    const commitDraft = () => {
        const n = Math.round(Number(draft));
        if (Number.isFinite(n) && n >= 1) setQty(line.key, n);
        else setDraft(String(line.qty));
    };

    const leave = message => {
        const snapshot = cart;
        setLeaving(true);
        setTimeout(() => removeLine(line.key), 250);
        toast(message, { label: 'Undo', fn: () => setCart(snapshot) });
    };

    const moveToFavourites = async () => {
        if (!user && !(await requireAuth('Log in to move pieces to your favourites ♡'))) return;
        addFav(line.productId);
        leave('Moved to favourites ♡');
    };

    return (
        <div className={`cart-item${leaving ? ' is-leaving' : ''}`}>
            <Link to={{ pathname: `/product/${p.slug}` }} state={{ variantId: v.id }} className="cart-thumb product-img" tabIndex={-1} aria-hidden="true">
                {photo && <img src={photo.url} alt="" loading="lazy" />}
            </Link>
            <div className="cart-info">
                <h3><Link to={{ pathname: `/product/${p.slug}` }} state={{ variantId: v.id }}>{p.name}</Link></h3>
                <p className="cart-variant">
                    <span className="swatch" style={{ '--swatch': v.color }} />
                    {v.name}
                    <span className="cart-size">· {sizeLabel(line.size)}</span>
                </p>
                {/* keyed: whole price swaps when a code is applied/removed (robust against translation add-ons) */}
                {prices.discounted ? (
                    <p key="promo" className="unit-price">
                        <s>{money(prices.unitOriginal)}</s> <span className="price-new">{money(prices.unit)}</span> each
                    </p>
                ) : (
                    <p key="regular" className="unit-price">{money(prices.unit)} each</p>
                )}
                <div className="cart-links">
                    <button type="button" className="btn-link" onClick={moveToFavourites}>Move to favourites</button>
                    <button type="button" className="btn-link danger" onClick={() => leave('Removed from cart')}>Remove</button>
                </div>
            </div>
            <div className="qty">
                <button type="button" aria-label="Decrease quantity" disabled={line.qty <= 1} onClick={() => setQty(line.key, line.qty - 1)}>−</button>
                <input
                    type="number"
                    min={1}
                    max={MAX_QTY}
                    value={draft}
                    aria-label={`Quantity of ${p.name}`}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={e => { if (e.key === 'Enter') commitDraft(); }}
                />
                <button type="button" aria-label="Increase quantity" disabled={line.qty >= MAX_QTY} onClick={() => setQty(line.key, line.qty + 1)}>+</button>
            </div>
            {/* with a promo code: the original price moves up and is crossed out,
                the new price takes its place in raspberry */}
            {prices.discounted ? (
                <div key="promo" className="line-total line-total--promo">
                    <s className="line-old" aria-label={`Was ${money(prices.totalOriginal)}`}>{money(prices.totalOriginal)}</s>
                    <span className="line-new">{money(prices.total)}</span>
                </div>
            ) : (
                <div key="regular" className="line-total"><span>{money(prices.total)}</span></div>
            )}
        </div>
    );
}

function Summary() {
    const { cart, cartCount, cartExtras, updateCartExtras, applyPromo } = useShop();
    const { user, requireAuth } = useAuth();
    const { productById } = useCatalog();
    const { toast } = useToast();
    const { subtotal, discount, shipping, gift, total } = useTotals();
    const [code, setCode] = useState('');
    const [checking, setChecking] = useState(false);
    const promo = cartExtras.promo;
    const promoFitsCart = promo && cart.some(l => promoApplies(promo, productById(l.productId), l.variantId));

    const submitPromo = async e => {
        e.preventDefault();
        const c = code.trim().toUpperCase();
        if (!c) return;
        setChecking(true);
        try {
            await applyPromo(c);
            setCode('');
            toast(`Code ${c} applied ♡`);
        } catch (err) {
            toast(err.message);
        }
        setChecking(false);
    };

    const checkout = async () => {
        if (!(await requireAuth('Log in to check out — your cart will be waiting for you ♡'))) return;
        toast('Checkout is coming soon ♡');
    };

    return (
        <aside className="summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Order summary</h2>
            <div className="sum-row"><span>Subtotal ({plural(cartCount, 'item')})</span><span>{money(subtotal)}</span></div>
            {discount > 0 && <div className="sum-row discount"><span>Discount ({promo.code})</span><span>−{money(discount)}</span></div>}
            <div className="sum-row"><span>Shipping</span><span>{shipping ? money(shipping) : 'Free'}</span></div>
            {gift > 0 && <div className="sum-row"><span>Gift wrapping</span><span>{money(gift)}</span></div>}
            <div className="sum-row sum-total"><span>Total</span><span>{money(total)}</span></div>

            {promo ? (
                <>
                    <div className="promo-applied">
                        <span>Code {promo.code} applied ♡</span>
                        <button type="button" className="btn-link" onClick={() => updateCartExtras({ promo: null })}>Remove</button>
                    </div>
                    {promo.scope === 'dark' && !promoFitsCart && (
                        <p className="promo-hint">This code takes {Math.round(promo.rate * 100)}% off pieces in dark colours — add one to see it here.</p>
                    )}
                </>
            ) : (
                <>
                    <form className="promo-form" onSubmit={submitPromo}>
                        <input className="field" placeholder="Promo code" aria-label="Promo code" value={code} onChange={e => setCode(e.target.value)} />
                        <button type="submit" className="btn btn-soft" disabled={checking}>Apply</button>
                    </form>
                    <p className="promo-hint">Psst… first order? Try <strong>SWEET10</strong></p>
                </>
            )}

            <div className="gift">
                <label>
                    <input type="checkbox" checked={cartExtras.giftWrap} onChange={e => updateCartExtras({ giftWrap: e.target.checked })} />
                    Wrap it with a satin ribbon (+{money(GIFT_WRAP_COST)})
                </label>
                {cartExtras.giftWrap && (
                    <textarea
                        maxLength={200}
                        placeholder="Add a little note for them (optional)"
                        aria-label="Gift note"
                        value={cartExtras.giftNote}
                        onChange={e => updateCartExtras({ giftNote: e.target.value })}
                    />
                )}
            </div>

            <button type="button" className="btn btn-primary checkout" onClick={checkout}>CHECKOUT</button>
            {!user && <p className="checkout-note">You'll be asked to log in or create an account to check out.</p>}
            <ul className="perks">
                <li>Estimated delivery: 5–8 business days</li>
                <li>30-day sweet returns</li>
                <li>Secure checkout</li>
                <li>Hand-packed with tissue &amp; ribbon</li>
            </ul>
        </aside>
    );
}
