import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { HeartIcon, UserIcon } from '../components/Icons.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { plural } from '../utils.js';

const banner = (
    <section className="page-banner">
        <p className="eyebrow">Your little wishlist</p>
        <h1>Favourites</h1>
        <p className="banner-text">Every piece you've hearted lives here. Gather them into collections — outfits, wishlists, tea-party looks, anything you like.</p>
    </section>
);

export default function FavouritesPage() {
    const { user, ready, requireAuth } = useAuth();

    let content = null;
    if (ready && !user) {
        content = (
            <EmptyState icon={<UserIcon />} title="Log in to see your favourites" text="Your hearted pieces and collections are saved to your account, so they're waiting on every device.">
                <button type="button" className="btn btn-primary" onClick={() => requireAuth()}>Log in or sign up</button>
            </EmptyState>
        );
    } else if (user) {
        content = <Favourites />;
    }

    return <Layout banner={banner}>{content}</Layout>;
}

function Favourites() {
    const { favs, createCollection, renameCollection, deleteCollection } = useShop();
    const { productById } = useCatalog();
    const { toast } = useToast();
    const { openDialog } = useUI();
    const [active, setActive] = useState('all');

    const collection = favs.collections.find(c => c.id === active);
    const items = (collection ? collection.items : favs.items).map(productById).filter(Boolean);

    const newCollection = async () => {
        const name = await openDialog({ title: 'New collection', input: true, placeholder: 'e.g. Tea Party Outfits', confirm: 'Create' });
        if (!name) return;
        setActive(createCollection(name));
        toast(`“${name}” created ♡`);
    };

    const rename = async () => {
        const name = await openDialog({ title: 'Rename collection', input: true, value: collection.name, confirm: 'Rename' });
        if (name) renameCollection(collection.id, name);
    };

    const remove = async () => {
        const ok = await openDialog({
            title: 'Delete collection?',
            text: <><strong>{collection.name}</strong> will be deleted. Don't worry — the pieces inside stay in your favourites.</>,
            confirm: 'Delete',
            danger: true,
        });
        if (!ok) return;
        deleteCollection(collection.id);
        setActive('all');
    };

    let content;
    if (items.length) {
        content = (
            <div className="product-grid">
                {items.map(p => <ProductCard key={p.id} product={p} organize fadeOnUnfav />)}
            </div>
        );
    } else if (collection) {
        content = (
            <EmptyState icon={<HeartIcon />} title="This collection is empty" text="Open “Add to a collection” on any favourite to tuck it in here.">
                <button type="button" className="btn btn-primary" onClick={() => setActive('all')}>See all favourites</button>
            </EmptyState>
        );
    } else {
        content = (
            <EmptyState icon={<HeartIcon />} title="No favourites yet" text="Tap the little heart on any piece you love and it will wait for you here.">
                <Link className="btn btn-primary" to="/">Start browsing</Link>
            </EmptyState>
        );
    }

    return (
        <section>
            <div className="collections-bar" aria-label="Collections">
                <button type="button" className={`chip${collection ? '' : ' is-active'}`} aria-pressed={!collection} onClick={() => setActive('all')}>
                    All favourites <span>{favs.items.length}</span>
                </button>
                {favs.collections.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        className={`chip${c.id === collection?.id ? ' is-active' : ''}`}
                        aria-pressed={c.id === collection?.id}
                        onClick={() => setActive(c.id)}
                    >
                        {c.name} <span>{c.items.length}</span>
                    </button>
                ))}
                <button type="button" className="chip chip-add" onClick={newCollection}>+ New collection</button>
            </div>

            <div className="collection-head">
                <div>
                    <h2 className="section-title">{collection ? collection.name : 'All favourites'}</h2>
                    <p className="muted">{plural(items.length, 'piece')}</p>
                </div>
                {collection && (
                    <div className="collection-actions">
                        <button type="button" className="btn-link" onClick={rename}>Rename</button>
                        <button type="button" className="btn-link danger" onClick={remove}>Delete collection</button>
                    </div>
                )}
            </div>

            {content}
        </section>
    );
}
