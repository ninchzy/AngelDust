import { forwardRef, useMemo, useState } from 'react';
import ProductCard from './ProductCard.jsx';
import EmptyState from './EmptyState.jsx';
import { SearchIcon } from './Icons.jsx';
import { plural } from '../utils.js';

const SORTERS = {
    featured: null,
    low: (a, b) => a.price - b.price,
    high: (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
};

// Title + sort menu + product grid, shared by the home page and the category pages.
const ProductSection = forwardRef(function ProductSection({ title, products }, ref) {
    const [sort, setSort] = useState('featured');
    const list = useMemo(
        () => (SORTERS[sort] ? [...products].sort(SORTERS[sort]) : products),
        [products, sort]
    );

    return (
        <section id="shop" className="shop-section" ref={ref}>
            <div className="toolbar">
                <div>
                    <h2 className="section-title">{title}</h2>
                    <p className="muted">{plural(list.length, 'piece')}</p>
                </div>
                <label className="sort">
                    Sort by
                    <select value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="featured">Featured</option>
                        <option value="low">Price: low to high</option>
                        <option value="high">Price: high to low</option>
                        <option value="name">Name</option>
                    </select>
                </label>
            </div>

            <div className="product-grid">
                {list.length ? list.map(p => <ProductCard key={p.id} product={p} />) : (
                    <EmptyState
                        style={{ gridColumn: '1 / -1' }}
                        icon={<SearchIcon />}
                        title="Nothing here… yet"
                        text="We couldn't find a piece matching that. Try another word or category."
                    />
                )}
            </div>
        </section>
    );
});

export default ProductSection;

// Filters by the ?q= search text (case-insensitive, matches anywhere in the name).
export const matchesSearch = (product, q) => !q || product.name.toLowerCase().includes(q.toLowerCase());
