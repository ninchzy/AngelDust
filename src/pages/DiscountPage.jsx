import Layout from '../components/Layout.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { FEATURED_PROMO } from '../config.js';
import { copyText } from '../utils.js';

// Hidden page (not in the menu) reached by clicking the promo slide in the hero.
export default function DiscountPage() {
    const { products, promoByCode } = useCatalog();
    const { toast } = useToast();
    const promo = promoByCode(FEATURED_PROMO);
    // every piece that comes in at least one dark colour (black, raven black, wine, midnight navy …)
    const items = products.filter(p => p.dark);

    const copy = async () => {
        toast(await copyText(promo.code) ? `Code ${promo.code} copied ♡` : `Use code ${promo.code} at checkout ♡`);
    };

    const banner = (
        <section className="page-banner page-banner--dark">
            <p className="eyebrow">The dark edit</p>
            <h1>Black Lace &amp; Velvet</h1>
            {promo ? (
                <>
                    <p className="banner-text">
                        Take {Math.round(promo.rate * 100)}% off every dark colour below — black, raven black, wine and midnight navy. Just add the code in your cart.
                    </p>
                    <button type="button" className="code-chip" onClick={copy} aria-label={`Copy promo code ${promo.code}`}>
                        {promo.code}<span>Copy</span>
                    </button>
                </>
            ) : (
                <p className="banner-text">This offer has ended — but the pieces are still here for you.</p>
            )}
        </section>
    );

    return (
        <Layout banner={banner}>
            <div className="product-grid">
                {items.map(p => <ProductCard key={p.id} product={p} onlyDark />)}
            </div>
        </Layout>
    );
}
