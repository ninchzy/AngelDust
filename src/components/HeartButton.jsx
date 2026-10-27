import { useEffect, useRef, useState } from 'react';
import { HeartIcon } from './Icons.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useUI } from '../context/UIContext.jsx';

const BURST_SIZE = 8;

function makeBurst() {
    const burstId = Date.now() + Math.random();
    return Array.from({ length: BURST_SIZE }, (_, i) => {
        const angle = (-90 + (i - (BURST_SIZE - 1) / 2) * 20) * Math.PI / 180;
        const dist = 42 + Math.random() * 30;
        return {
            id: `${burstId}-${i}`,
            burstId,
            blossom: i % 3 === 0,
            style: {
                '--dx': `${Math.cos(angle) * dist}px`,
                '--dy': `${Math.sin(angle) * dist - 12}px`,
                '--r': `${(Math.random() - 0.5) * 70}deg`,
                '--size': `${10 + Math.random() * 8}px`,
                '--delay': `${Math.random() * 0.15}s`,
            },
        };
    });
}

// The favourite heart: pulses + floats little hearts when switched on, asks to log in first,
// then offers the collection picker. `onRemoveStart` lets a card fade itself out before removal.
export default function HeartButton({ product, className = '', onRemoveStart }) {
    const { favs, isFav, isFavNow, waitForFavs, addFav, removeFav, restoreFav } = useShop();
    const { user, requireAuth } = useAuth();
    const { toast } = useToast();
    const { openCollections } = useUI();
    const [pulseKey, setPulseKey] = useState(0);
    const [floatHearts, setFloatHearts] = useState([]);
    const [removing, setRemoving] = useState(false);
    const timers = useRef(new Set());
    const askTimer = useRef(null);
    const waitingForLogin = useRef(false);

    const later = (fn, ms) => {
        const t = setTimeout(() => { timers.current.delete(t); fn(); }, ms);
        timers.current.add(t);
    };

    useEffect(() => () => {
        timers.current.forEach(clearTimeout);
        clearTimeout(askTimer.current);
    }, []);

    const fav = isFav(product.id) && !removing;

    const heartOn = () => {
        addFav(product.id);
        setPulseKey(k => k + 1);
        const burst = makeBurst();
        setFloatHearts(h => [...h, ...burst]);
        later(() => setFloatHearts(h => h.filter(x => x.burstId !== burst[0].burstId)), 1300);
        // let the little hearts float for a moment before asking about collections
        askTimer.current = setTimeout(() => openCollections(product.id, true), 650);
    };

    const heartOff = () => {
        clearTimeout(askTimer.current);
        const snapshot = favs;
        if (onRemoveStart) {
            setRemoving(true);
            onRemoveStart();
            later(() => removeFav(product.id), 300);
        } else {
            removeFav(product.id);
        }
        toast('Removed from favourites', { label: 'Undo', fn: () => restoreFav(snapshot, product.id) });
    };

    const onClick = async () => {
        if (removing || waitingForLogin.current) return;
        if (user) return fav ? heartOff() : heartOn();

        waitingForLogin.current = true;
        const ok = await requireAuth('Log in to save pieces to your favourites ♡');
        if (ok) await waitForFavs();
        waitingForLogin.current = false;
        if (!ok) return;
        if (isFavNow(product.id)) toast('Already in your favourites ♡');
        else heartOn();
    };

    return (
        <button
            type="button"
            className={`heart-btn${fav ? ' is-fav' : ''} ${className}`.trim()}
            aria-pressed={fav}
            aria-label={`${fav ? 'Remove from' : 'Add to'} favourites`}
            onClick={onClick}
        >
            {/* new keys remount these, which replays the pulse + ring */}
            <HeartIcon key={pulseKey} className={pulseKey ? 'pulse' : undefined} />
            {pulseKey > 0 && <span key={`ring-${pulseKey}`} className="heart-ring" />}
            {floatHearts.map(h => (
                <span key={h.id} className={`float-heart${h.blossom ? ' is-blossom' : ''}`} style={h.style}>
                    <HeartIcon />
                </span>
            ))}
        </button>
    );
}
