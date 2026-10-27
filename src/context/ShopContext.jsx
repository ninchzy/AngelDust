import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { MAX_QTY } from '../config.js';
import { uuid } from '../utils.js';
import { useAuth } from './AuthContext.jsx';
import { useCatalog } from './CatalogContext.jsx';
import { useToast } from './ToastContext.jsx';

// Guests keep their cart in the browser; logged-in carts live in MySQL.
const GUEST_CART = 'angeldust.cart';
const GUEST_EXTRAS = 'angeldust.cartExtras';

const EMPTY_FAVS = { items: [], collections: [] };
const EMPTY_EXTRAS = { promo: null, giftWrap: false, giftNote: '' };

const clampQty = n => Math.max(1, Math.min(MAX_QTY, n));

function readLocal(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* storage unavailable */ }
}

// Cart line: { key, productId, variantId, size, qty } — one line per colour + size.
const toLine = ({ productId, variantId, size = '', qty }) => ({
    key: `${variantId}|${size}`, productId, variantId, size, qty: clampQty(qty),
});

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
    const { productById } = useCatalog();
    const { user, ready, sessionExpired } = useAuth();
    const { toast } = useToast();

    const validLines = lines => (Array.isArray(lines) ? lines : [])
        .filter(l => {
            const p = productById(l?.productId);
            return p && p.variants.some(v => v.id === l.variantId) && p.sizes.includes(l.size);
        })
        .map(toLine);

    const [favs, setFavs] = useState(EMPTY_FAVS);
    const [cart, setCart] = useState(() => validLines(readLocal(GUEST_CART, [])));
    const [cartExtras, setCartExtras] = useState(() => ({ ...EMPTY_EXTRAS, ...readLocal(GUEST_EXTRAS, {}) }));
    // bumped whenever something is added, so header badges can replay their bounce
    const [bumps, setBumps] = useState({ favs: 0, cart: 0 });
    const bump = which => setBumps(b => ({ ...b, [which]: b[which] + 1 }));

    const latest = useRef({});
    latest.current = { favs, cart, cartExtras };
    const queue = useRef(Promise.resolve());      // keeps favourite requests in order
    const favsLoaded = useRef(Promise.resolve());
    const cartSynced = useRef(false);             // cart state mirrors the server for this user
    const skipNextSave = useRef(false);
    const prevUserId = useRef(undefined);

    const onError = useCallback(err => {
        if (err.status === 401) {
            sessionExpired();
            toast('Your session has ended — please log in again.');
        } else {
            toast(err.message);
        }
    }, [sessionExpired, toast]);

    const enqueue = fn => {
        const p = queue.current.then(fn);
        queue.current = p.catch(() => {});
        return p;
    };

    const reloadFavs = () => enqueue(() => api('/favourites')).then(setFavs).catch(() => {});

    // Optimistic update already applied; send the change, and resync if it fails.
    const sync = fn => enqueue(fn).catch(err => { onError(err); reloadFavs(); });

    const applyServerCart = server => {
        skipNextSave.current = true;
        cartSynced.current = true;
        setCart(validLines(server.items));
        setCartExtras({ promo: server.promo, giftWrap: server.giftWrap, giftNote: server.giftNote });
    };

    /* ----- log in / log out ----- */

    useEffect(() => {
        if (!ready) return;
        const id = user ? user.id : null;
        if (prevUserId.current === id) return;
        const wasLoggedIn = prevUserId.current != null;
        prevUserId.current = id;
        cartSynced.current = false;

        if (id) {
            favsLoaded.current = enqueue(() => api('/favourites')).then(setFavs).catch(onError);
            const { cart: guestCart, cartExtras: guestExtras } = latest.current;
            api('/cart/merge', {
                method: 'POST',
                body: {
                    items: guestCart.map(l => ({ variantId: l.variantId, size: l.size, qty: l.qty })),
                    promoCode: guestExtras.promo?.code,
                    giftWrap: guestExtras.giftWrap,
                    giftNote: guestExtras.giftNote,
                },
            })
                .then(server => {
                    applyServerCart(server);
                    writeLocal(GUEST_CART, []);
                    writeLocal(GUEST_EXTRAS, EMPTY_EXTRAS);
                })
                .catch(onError);
        } else {
            setFavs(EMPTY_FAVS);
            if (wasLoggedIn) {
                setCart([]);
                setCartExtras(EMPTY_EXTRAS);
            }
        }
    }, [user, ready]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ----- save the cart ----- */

    useEffect(() => {
        if (!ready) return;
        if (!user) {
            writeLocal(GUEST_CART, cart);
            writeLocal(GUEST_EXTRAS, cartExtras);
            return;
        }
        if (!cartSynced.current) return;
        if (skipNextSave.current) {
            skipNextSave.current = false;
            return;
        }
        const t = setTimeout(() => {
            api('/cart', {
                method: 'PUT',
                body: {
                    items: cart.map(l => ({ variantId: l.variantId, size: l.size, qty: l.qty })),
                    promoCode: cartExtras.promo?.code || null,
                    giftWrap: cartExtras.giftWrap,
                    giftNote: cartExtras.giftNote,
                },
            }).catch(onError);
        }, 400);
        return () => clearTimeout(t);
    }, [cart, cartExtras, user, ready, onError]);

    /* ----- favourites + collections (logged-in only; callers ask for login first) ----- */

    const isFav = id => favs.items.includes(id);
    const isFavNow = id => latest.current.favs.items.includes(id);
    const waitForFavs = () => favsLoaded.current;

    const addFav = id => {
        setFavs(f => (f.items.includes(id) ? f : { ...f, items: [id, ...f.items] }));
        bump('favs');
        sync(() => api(`/favourites/${id}`, { method: 'PUT' }));
    };

    const removeFav = id => {
        setFavs(f => ({
            items: f.items.filter(x => x !== id),
            collections: f.collections.map(c => ({ ...c, items: c.items.filter(x => x !== id) })),
        }));
        sync(() => api(`/favourites/${id}`, { method: 'DELETE' }));
    };

    // Undo for removeFav: puts the piece back, including its collections.
    const restoreFav = (snapshot, id) => {
        setFavs(snapshot);
        const collectionIds = snapshot.collections.filter(c => c.items.includes(id)).map(c => c.id);
        sync(() => api(`/favourites/${id}/collections`, { method: 'PUT', body: { collectionIds } }));
    };

    const createCollection = name => {
        const id = uuid();
        setFavs(f => ({ ...f, collections: [...f.collections, { id, name, items: [] }] }));
        sync(() => api('/collections', { method: 'POST', body: { id, name } }));
        return id;
    };

    const renameCollection = (id, name) => {
        setFavs(f => ({ ...f, collections: f.collections.map(c => (c.id === id ? { ...c, name } : c)) }));
        sync(() => api(`/collections/${id}`, { method: 'PATCH', body: { name } }));
    };

    const deleteCollection = id => {
        setFavs(f => ({ ...f, collections: f.collections.filter(c => c.id !== id) }));
        sync(() => api(`/collections/${id}`, { method: 'DELETE' }));
    };

    const setItemCollections = (itemId, collectionIds) => {
        setFavs(f => ({
            ...f,
            collections: f.collections.map(c => {
                const has = c.items.includes(itemId);
                const want = collectionIds.includes(c.id);
                if (want && !has) return { ...c, items: [itemId, ...c.items] };
                if (!want && has) return { ...c, items: c.items.filter(x => x !== itemId) };
                return c;
            }),
        }));
        sync(() => api(`/favourites/${itemId}/collections`, { method: 'PUT', body: { collectionIds } }));
    };

    /* ----- cart (anyone) ----- */

    const addToCart = (productId, variantId, size, qty = 1) => {
        const key = `${variantId}|${size}`;
        setCart(c => (c.some(l => l.key === key)
            ? c.map(l => (l.key === key ? { ...l, qty: clampQty(l.qty + qty) } : l))
            : [...c, toLine({ productId, variantId, size, qty })]));
        bump('cart');
    };

    const setQty = (key, qty) => setCart(c => c.map(l => (l.key === key ? { ...l, qty: clampQty(qty) } : l)));
    const removeLine = key => setCart(c => c.filter(l => l.key !== key));
    const clearCart = () => setCart([]);
    const updateCartExtras = patch => setCartExtras(e => ({ ...e, ...patch }));

    // Throws ApiError (with a friendly message) if the code isn't valid.
    const applyPromo = async code => {
        const { promo } = await api(`/promos/${encodeURIComponent(code)}`);
        updateCartExtras({ promo });
        return promo;
    };

    const value = {
        favs, isFav, isFavNow, waitForFavs, addFav, removeFav, restoreFav,
        createCollection, renameCollection, deleteCollection, setItemCollections,
        cart, setCart, addToCart, setQty, removeLine, clearCart,
        cartExtras, updateCartExtras, applyPromo,
        favCount: favs.items.length,
        cartCount: cart.reduce((n, l) => n + l.qty, 0),
        bumps,
    };

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);
