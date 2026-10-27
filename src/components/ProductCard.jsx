import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import HeartButton from './HeartButton.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { FEATURED_PROMO } from '../config.js';
import { copyText, darkVariants, discountedPrice, isOneSize, money, photosFor, promoApplies } from '../utils.js';

// organize: show the collections row (favourites page)
// fadeOnUnfav: fade the card out before removing it (favourites page)
// onlyDark: show just the dark colours (the dark-edit promo page)
// Whenever a dark colour is selected, the card shows the BLACKLACE10 price.
export default function ProductCard({ product: p, organize = false, fadeOnUnfav = false, onlyDark = false }) {
    const { favs, addToCart } = useShop();
    const { toast } = useToast();
    const { openCollections } = useUI();
    const { promoByCode } = useCatalog();
    const promo = promoByCode(FEATURED_PROMO);
    const colours = onlyDark && darkVariants(p).length ? darkVariants(p) : p.variants;
    const [variantId, setVariantId] = useState(colours[0]?.id);
    const [added, setAdded] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [pickingSize, setPickingSize] = useState(false);
    const addedTimer = useRef(null);
    const sizeRef = useRef(null);

    useEffect(() => () => clearTimeout(addedTimer.current), []);

    // close the size picker when clicking anywhere else
    useEffect(() => {
        if (!pickingSize) return;
        const onDown = e => { if (!sizeRef.current?.contains(e.target)) setPickingSize(false); };
        const onKey = e => { if (e.key === 'Escape') setPickingSize(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [pickingSize]);

    const variant = p.variants.find(v => v.id === variantId);
    const photo = photosFor(p, variantId)[0];
    const showPromo = promoApplies(promo, p, variantId);
    const productLink = { pathname: `/product/${p.slug}`, state: { variantId } };

    const add = size => {
        if (!variant) return;
        addToCart(p.id, variant.id, size);
        setPickingSize(false);
        setAdded(true);
        clearTimeout(addedTimer.current);
        addedTimer.current = setTimeout(() => setAdded(false), 2000);
    };

    const onAddClick = () => (isOneSize(p) ? add(p.sizes[0] || 'One size') : setPickingSize(true));

    const copyPromo = async () => {
        toast(await copyText(promo.code) ? `Code ${promo.code} copied ♡` : `Use code ${promo.code} at checkout ♡`);
    };

    const inCollections = organize ? favs.collections.filter(c => c.items.includes(p.id)) : [];

    return (
        <article className={`card${leaving ? ' is-leaving' : ''}`}>
            <Link to={productLink} className="card-media" tabIndex={-1} aria-hidden="true">
                <div className="product-img">
                    {photo && <img src={photo.url} alt="" loading="lazy" />}
                </div>
                {p.tag && <span className="card-tag">{p.tag}</span>}
            </Link>

            <div className="card-body">
                <h3 className="card-title">
                    <Link to={productLink}>{p.name}</Link>
                </h3>

                <div className="card-row">
                    {/* different keys: React swaps the whole price instead of editing its text, which
                        stays reliable even when translation add-ons have rewritten the page text */}
                    {showPromo ? (
                        <span key="promo" className="price price--promo">
                            <s className="price-old" aria-label={`Was ${money(p.price)}`}>{money(p.price)}</s>
                            <span className="price-new">{money(discountedPrice(p.price, promo.rate))}</span>
                            <small>USD</small>
                        </span>
                    ) : (
                        <span key="regular" className="price"><span>{money(p.price)}</span><small>USD</small></span>
                    )}
                    <HeartButton product={p} onRemoveStart={fadeOnUnfav ? () => setLeaving(true) : undefined} />
                </div>

                {showPromo && (
                    <button type="button" className="promo-pill" title={`Copy code ${promo.code}`} onClick={copyPromo}>
                        WITH PROMO CODE
                    </button>
                )}

                <div className="variants-wrap">
                    <div className="variants" role="radiogroup" aria-label="Colour">
                        {colours.map(v => (
                            <button
                                key={v.id}
                                type="button"
                                role="radio"
                                className={`variant${v.id === variantId ? ' is-selected' : ''}`}
                                aria-checked={v.id === variantId}
                                aria-label={v.name}
                                title={v.name}
                                style={{ '--swatch': v.color }}
                                onClick={() => setVariantId(v.id)}
                            />
                        ))}
                    </div>
                    <span key={variantId} className="variant-name">{variant?.name}</span>
                </div>

                {organize && (
                    <div className="card-collections">
                        {inCollections.map(c => <span key={c.id} className="mini-tag">{c.name}</span>)}
                        <button type="button" className="btn-link" onClick={() => openCollections(p.id, false)}>
                            {inCollections.length ? 'Edit collections' : 'Add to a collection'}
                        </button>
                    </div>
                )}

                {pickingSize ? (
                    <div className="size-quick" ref={sizeRef} role="group" aria-label={`Choose a size for ${p.name}`}>
                        {p.sizes.map((s, i) => (
                            <button key={s} type="button" className="size-chip" autoFocus={i === 0} onClick={() => add(s)}>{s}</button>
                        ))}
                        <button type="button" className="size-quick-close" aria-label="Cancel" onClick={() => setPickingSize(false)}>×</button>
                    </div>
                ) : (
                    <button type="button" className={`add-cart${added ? ' is-added' : ''}`} onClick={onAddClick}>
                        {added ? 'ADDED TO CART' : 'ADD TO CART'}
                    </button>
                )}
            </div>
        </article>
    );
}
