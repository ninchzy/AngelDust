import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

// Slide-in menu for smaller screens: the categories from the bar, plus the search pill
// once the bar is sticky (`search` is passed only then).
export default function MobileMenu({ open, onClose, categories, active, search }) {
    const closeRef = useRef(null);
    const lastFocus = useRef(null);

    useEffect(() => {
        if (!open) return;
        lastFocus.current = document.activeElement;
        document.body.classList.add('modal-open');
        closeRef.current?.focus();
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.classList.remove('modal-open');
            document.removeEventListener('keydown', onKey);
            lastFocus.current?.focus?.();
        };
    }, [open, onClose]);

    return createPortal(
        <>
            <div className={`menu-backdrop${open ? ' is-open' : ''}`} onClick={onClose} aria-hidden="true" />
            <aside
                className={`menu-drawer${open ? ' is-open' : ''}`}
                aria-label="Menu"
                aria-hidden={!open}
                inert={!open}
            >
                <div className="menu-head">
                    <Link to="/" className="menu-monogram" aria-label="Angel Dust — home" onClick={onClose}>
                        <span className="monogram" aria-hidden="true" />
                    </Link>
                    <button ref={closeRef} type="button" className="modal-close menu-close" aria-label="Close menu" onClick={onClose}>×</button>
                </div>

                {search && (
                    <form
                        className="search menu-search"
                        role="search"
                        onSubmit={e => { search.onSubmit(e); onClose(); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
                        <input type="search" placeholder="Search dresses, bows, lace…" aria-label="Search pieces" value={search.query} onChange={search.onChange} />
                    </form>
                )}

                <nav aria-label="Categories">
                    <ul className="menu-links">
                        {categories.map(c => (
                            <li key={c.id}>
                                <Link
                                    className={`menu-link${active === c.id ? ' is-active' : ''}`}
                                    to={c.id === 'all' ? '/' : `/category/${c.id}`}
                                    state={c.id === 'all' ? { scrollToShop: true } : undefined}
                                    aria-current={active === c.id ? 'page' : undefined}
                                    onClick={onClose}
                                >
                                    {c.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <p className="menu-foot">sweet lolita atelier ♡</p>
            </aside>
        </>,
        document.body
    );
}
