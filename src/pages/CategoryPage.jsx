import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ProductSection, { matchesSearch } from '../components/ProductSection.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { plural } from '../utils.js';

// One page per category (/category/dresses …) — same frame as the rest of the site, no hero.
export default function CategoryPage() {
    const { slug } = useParams();
    const { categories, products } = useCatalog();
    const [params] = useSearchParams();
    const q = (params.get('q') || '').trim();
    const category = categories.find(c => c.id === slug && c.id !== 'all');

    if (!category) return <Navigate to="/" replace />;

    const inCategory = products.filter(p => p.category === category.id);
    const shown = inCategory.filter(p => matchesSearch(p, q));

    const banner = (
        <section className="page-banner">
            <p className="eyebrow">The collection</p>
            <h1>{category.label}</h1>
            <p className="banner-text">{plural(inCategory.length, 'piece')} to fall in love with — sewn with lace, ribbons and a little bit of magic.</p>
        </section>
    );

    return (
        <Layout banner={banner}>
            <ProductSection
                key={category.id}
                title={q ? `Results for “${q}” in ${category.label}` : `All ${category.label.toLowerCase()}`}
                products={shown}
            />
        </Layout>
    );
}
