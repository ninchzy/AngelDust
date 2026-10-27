import { useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import HeroSlider from '../components/HeroSlider.jsx';
import ProductSection, { matchesSearch } from '../components/ProductSection.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { FEATURED_PROMO } from '../config.js';

export default function ShopPage() {
    const { products, promoByCode } = useCatalog();
    const [params] = useSearchParams();
    const location = useLocation();
    const q = (params.get('q') || '').trim();
    const shopRef = useRef(null);
    const promo = promoByCode(FEATURED_PROMO);

    // "All pieces" (and arriving with a search) glides down to the grid
    useEffect(() => {
        if (location.state?.scrollToShop) shopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (q) shopRef.current.scrollIntoView({ block: 'start' });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const slides = [
        <div className="hero-slide" key="welcome">
            <div className="hero-text">
                <p className="eyebrow">New season · Lace &amp; Ribbons</p>
                <h1 className="hero-title">Dressed like a <em>porcelain dream</em></h1>
                <p>Puffy sleeves, layered petticoats and gentle lace — pieces made for tea parties, slow afternoons and every sweet moment in between.</p>
                <button type="button" className="btn btn-primary" onClick={() => shopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                    Shop the collection
                </button>
            </div>
            <div className="hero-media hero-media--sweet product-img">
                <img src="/hero/hero-1.webp" alt="A model in a pink strawberry-print lolita dress with bunny-ear headbow" />
            </div>
        </div>,
    ];

    if (promo) {
        const pct = Math.round(promo.rate * 100);
        slides.push(
            // the whole slide is the link to the hidden discount page
            <Link className="hero-slide hero-slide--promo" to="/dark-lace" key="promo">
                <div className="hero-text">
                    <p className="eyebrow">Limited offer · Dark garments</p>
                    <h2 className="hero-title">Use promo code <em>{promo.code}</em></h2>
                    <p>…and get <strong>{pct}% off</strong> on our dark garments — gothic lace, velvet bows and midnight ruffles.</p>
                    <span className="btn btn-accent">Shop the dark edit →</span>
                </div>
                <div className="hero-media hero-media--dark product-img product-img--dark">
                    <img src="/hero/hero-2.webp" alt="A model in a black gothic dress with a skeleton corset and a lace veil" />
                </div>
            </Link>
        );
    }

    return (
        <Layout banner={<HeroSlider slides={slides} />}>
            <ProductSection
                ref={shopRef}
                title={q ? `Results for “${q}”` : 'All pieces'}
                products={products.filter(p => matchesSearch(p, q))}
            />
        </Layout>
    );
}
