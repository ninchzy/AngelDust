import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import Gallery from '../components/Gallery.jsx';
import HeartButton from '../components/HeartButton.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FEATURED_PROMO, FREE_SHIPPING_FROM, MAX_QTY } from '../config.js';
import { copyText, discountedPrice, isOneSize, money, photosFor, promoApplies } from '../utils.js';

// Lolita sizing (garment measurements, in cm)
const SIZE_GUIDE = [
    ['XS', '76–80', '60–64', '80'],
    ['S', '80–84', '64–68', '82'],
    ['M', '84–88', '68–72', '84'],
    ['L', '88–92', '72–76', '86'],
    ['XL', '92–96', '76–80', '88'],
];

const CARE = {
    dresses: 'Polyester and cotton blend with lace trims. Hand wash cold or dry clean, hang to dry, and steam the ruffles back to life.',
    sets: 'Polyester and cotton blend with lace trims. Hand wash cold or dry clean, hang to dry, and steam the ruffles back to life.',
    skirts: 'Polyester with a tulle petticoat lining. Hand wash cold, hang to dry; a little steam brings the volume back.',
    tops: 'Soft cotton blend. Gentle machine wash in a laundry bag at 30°C, iron on low.',
    accessories: 'Wipe or hand wash gently, reshape the bows while damp and leave to dry flat.',
};

export default function ProductPage() {
    const { slug } = useParams();
    const location = useLocation();
    const { products, categories, promoByCode } = useCatalog();
    const product = products.find(p => p.slug === slug);

    if (!product) return <Navigate to="/" replace />;
    // key: start fresh (colour, size, photo) when moving to another product
    return <ProductView key={product.id} product={product} initialVariant={location.state?.variantId}
        categories={categories} products={products} promo={promoByCode(FEATURED_PROMO)} />;
}

function ProductView({ product: p, initialVariant, categories, products, promo }) {
    const { addToCart } = useShop();
    const { toast } = useToast();
    const [variantId, setVariantId] = useState(
        p.variants.some(v => v.id === initialVariant) ? initialVariant : p.variants[0]?.id
    );
    const [size, setSize] = useState(isOneSize(p) ? p.sizes[0] || 'One size' : null);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [needSize, setNeedSize] = useState(false);
    const [shake, setShake] = useState(0);   // bumping this remounts the size buttons → replays the shake
    const addedTimer = useRef(null);

    useEffect(() => () => clearTimeout(addedTimer.current), []);

    const variant = p.variants.find(v => v.id === variantId);
    const category = categories.find(c => c.id === p.category);
    const promoNow = promoApplies(promo, p, variantId);          // this colour is discounted
    const promoOther = !promoNow && promoApplies(promo, p);      // another colour of this piece is
    const related = [
        ...products.filter(x => x.category === p.category && x.id !== p.id),
        ...products.filter(x => x.category !== p.category),
    ].slice(0, 4);

    const copyPromo = async () => {
        toast(await copyText(promo.code) ? `Code ${promo.code} copied ♡` : `Use code ${promo.code} at checkout ♡`);
    };

    const onAdd = () => {
        if (!size) {
            setNeedSize(true);
            setShake(n => n + 1);
            return;
        }
        addToCart(p.id, variant.id, size, qty);
        setAdded(true);
        clearTimeout(addedTimer.current);
        addedTimer.current = setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Layout>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link to="/">Home</Link>
                <span aria-hidden="true">›</span>
                {category && <><Link to={`/category/${category.id}`}>{category.label}</Link><span aria-hidden="true">›</span></>}
                <span aria-current="page">{p.name}</span>
            </nav>

            <div className="product-layout">
                {/* key: reset to the first photo whenever the colour changes */}
                <Gallery key={variantId} photos={photosFor(p, variantId)} name={`${p.name} in ${variant?.name}`} />

                <section className="product-info" aria-labelledby="product-title">
                    {p.tag && <span className="card-tag product-tag">{p.tag}</span>}
                    <h1 id="product-title" className="product-title">{p.name}</h1>

                    <div className="product-price-row">
                        {/* keyed so the whole price is swapped (robust against translation add-ons) */}
                        {promoNow ? (
                            <span key="promo" className="product-price price--promo">
                                <s className="price-old" aria-label={`Was ${money(p.price)}`}>{money(p.price)}</s>
                                <span className="price-new">{money(discountedPrice(p.price, promo.rate))}</span>
                                <small>USD</small>
                            </span>
                        ) : (
                            <span key="regular" className="product-price"><span>{money(p.price)}</span><small>USD</small></span>
                        )}
                        <HeartButton product={p} />
                    </div>
                    {promoNow && (
                        <div className="product-promo-row">
                            <button type="button" className="promo-pill" title={`Copy code ${promo.code}`} onClick={copyPromo}>
                                WITH PROMO CODE
                            </button>
                            <Link to="/dark-lace" className="product-promo">
                                {variant?.name} is part of the dark edit — use <strong>{promo.code}</strong>
                            </Link>
                        </div>
                    )}
                    {promoOther && (
                        <Link to="/dark-lace" className="product-promo">
                            Dark colours of this piece are {Math.round(promo.rate * 100)}% off with code <strong>{promo.code}</strong>
                        </Link>
                    )}

                    <p className="product-desc">{p.description}</p>

                    <div className="option-block">
                        <p className="option-label">Colour: <strong key={variantId}>{variant?.name}</strong></p>
                        <div className="variants" role="radiogroup" aria-label="Colour">
                            {p.variants.map(v => (
                                <button
                                    key={v.id}
                                    type="button"
                                    role="radio"
                                    className={`variant variant--lg${v.id === variantId ? ' is-selected' : ''}`}
                                    aria-checked={v.id === variantId}
                                    aria-label={v.name}
                                    title={v.name}
                                    style={{ '--swatch': v.color }}
                                    onClick={() => setVariantId(v.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={`option-block${needSize ? ' needs-choice' : ''}`}>
                        <p className="option-label">
                            Size: <strong key={size || 'none'}>{size || 'choose one'}</strong>
                            {needSize && !size && <span className="option-warn" role="alert"> — please pick a size</span>}
                        </p>
                        {isOneSize(p) ? (
                            <p className="one-size">One size fits most — adjustable ribbons ♡</p>
                        ) : (
                            <div key={shake} className="size-options" role="radiogroup" aria-label="Size">
                                {p.sizes.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        role="radio"
                                        aria-checked={s === size}
                                        className={`size-option${s === size ? ' is-selected' : ''}`}
                                        onClick={() => { setSize(s); setNeedSize(false); }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="buy-row">
                        <div className="qty">
                            <button type="button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(q => q - 1)}>−</button>
                            <span className="qty-value" aria-live="polite">{qty}</span>
                            <button type="button" aria-label="Increase quantity" disabled={qty >= MAX_QTY} onClick={() => setQty(q => q + 1)}>+</button>
                        </div>
                        <button type="button" className={`add-cart add-cart--lg${added ? ' is-added' : ''}`} onClick={onAdd}>
                            {added ? 'ADDED TO CART' : 'ADD TO CART'}
                        </button>
                    </div>

                    <ul className="perks product-perks">
                        <li>Free shipping on orders over ${FREE_SHIPPING_FROM}</li>
                        <li>30-day sweet returns</li>
                        <li>Hand-packed with tissue &amp; ribbon</li>
                    </ul>

                    <div className="details">
                        {!isOneSize(p) && (
                            <details>
                                <summary>Size guide</summary>
                                <table className="size-table">
                                    <thead><tr><th>Size</th><th>Bust (cm)</th><th>Waist (cm)</th><th>Length (cm)</th></tr></thead>
                                    <tbody>
                                        {SIZE_GUIDE.map(([s, bust, waist, length]) => (
                                            <tr key={s} className={s === size ? 'is-selected' : undefined}>
                                                <td>{s}</td><td>{bust}</td><td>{waist}</td><td>{length}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="details-note">Between sizes? Lolita pieces have shirring or lace-up backs, so the smaller size usually fits beautifully.</p>
                            </details>
                        )}
                        <details>
                            <summary>Fabric &amp; care</summary>
                            <p>{CARE[p.category] || CARE.dresses}</p>
                        </details>
                        <details>
                            <summary>Shipping &amp; returns</summary>
                            <p>Ships in 2–4 business days and arrives in 5–8. Free shipping on orders over ${FREE_SHIPPING_FROM}. Changed your mind? Return unworn pieces within 30 days.</p>
                        </details>
                    </div>
                </section>
            </div>

            {related.length > 0 && (
                <section className="suggestions">
                    <h2 className="section-title">You might also love</h2>
                    <div className="product-grid">
                        {related.map(x => <ProductCard key={x.id} product={x} />)}
                    </div>
                </section>
            )}
        </Layout>
    );
}
