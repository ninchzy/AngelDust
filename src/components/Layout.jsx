import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BagIcon, ChevronIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from './Icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import FitText from './FitText.jsx';
import MobileMenu from './MobileMenu.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { FREE_SHIPPING_FROM } from '../config.js';
import { firstName, plural } from '../utils.js';

// Shared page frame. `banner` fills the hero / page-title area under the category bar.
// The category bar sits outside <header> so it can stay stuck to the top for the whole page.
export default function Layout({ banner, children }) {
    const { pathname } = useLocation();
    const search = useSearchBox();
    const sentinelRef = useRef(null);
    const bannerRef = useRef(null);
    const [stuck, setStuck] = useState(false);
    const [pastBanner, setPastBanner] = useState(false);

    // runs before page effects, so a page can still scroll somewhere on mount
    useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);

    // the bar counts as "stuck" once the invisible marker just above it scrolls off the top
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, []);

    // side logos appear once the hero / banner has scrolled up past the middle of the screen,
    // so they never sit on top of it
    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const bottom = bannerRef.current.getBoundingClientRect().bottom;
            setPastBanner(bottom < window.innerHeight / 2 - 90);
        };
        const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    return (
        <>
            <header>
                <div id="top_bar">
                    <p>
                        Free shipping on orders over ${FREE_SHIPPING_FROM}
                        <span className="tb-extra">
                            <span className="tb-sep">♡</span>Handmade lace details
                            <span className="tb-sep">♡</span>30-day sweet returns
                        </span>
                    </p>
                </div>
                <Header search={search} />
            </header>
            <div ref={sentinelRef} className="nav-sentinel" aria-hidden="true" />
            <CategoryNav stuck={stuck} search={search} />
            <div id="main_product_window" ref={bannerRef}>{banner}</div>
            <main>{children}</main>
            <Footer />

            {/* monogram watermarks in the side margins (wide screens only) */}
            <span className={`side-logo side-logo--left${pastBanner ? ' is-visible' : ''}`} aria-hidden="true" />
            <span className={`side-logo side-logo--right${pastBanner ? ' is-visible' : ''}`} aria-hidden="true" />

            <FloatingButtons visible={stuck} />
        </>
    );
}

// Once the bar is sticky: a cart bubble under it on the right, and a back-to-top arrow.
function FloatingButtons({ visible }) {
    const { cartCount, bumps } = useShop();
    const { pathname } = useLocation();

    return (
        <>
            {pathname !== '/cart' && (
                <Link
                    to="/cart"
                    className={`float-btn float-cart${visible ? ' is-visible' : ''}`}
                    aria-label={`Cart, ${plural(cartCount, 'item')}`}
                    tabIndex={visible ? 0 : -1}
                    aria-hidden={!visible}
                >
                    <BagIcon />
                    <Badge count={cartCount} bump={bumps.cart} />
                </Link>
            )}
            <button
                type="button"
                className={`float-btn float-top${visible ? ' is-visible' : ''}`}
                aria-label="Back to top"
                tabIndex={visible ? 0 : -1}
                aria-hidden={!visible}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                <ChevronIcon direction="up" />
            </button>
        </>
    );
}

// One search state shared by the header pill and the pill that appears in the sticky bar.
// On the home page and category pages the results filter live while typing (?q=…);
// anywhere else, pressing Enter takes you to the results on the home page.
function useSearchBox() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const live = pathname === '/' || pathname.startsWith('/category/');
    const urlQuery = live ? params.get('q') || '' : '';
    const [query, setQuery] = useState(urlQuery);

    useEffect(() => { setQuery(urlQuery); }, [urlQuery]);

    const onChange = e => {
        const value = e.target.value;
        setQuery(value);
        if (!live) return;
        const next = new URLSearchParams(params);
        if (value.trim()) next.set('q', value); else next.delete('q');
        setParams(next, { replace: true });
    };

    const onSubmit = e => {
        e.preventDefault();
        if (!live && query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`);
    };

    return { query, onChange, onSubmit };
}

function SearchBox({ search, className = '' }) {
    return (
        <form className={`search ${className}`.trim()} role="search" onSubmit={search.onSubmit}>
            <SearchIcon />
            <input type="search" placeholder="Search dresses, bows, lace…" aria-label="Search pieces" value={search.query} onChange={search.onChange} />
        </form>
    );
}

function Badge({ count, bump }) {
    if (!count) return null;
    // a new key remounts the badge, which replays the bounce animation
    return <span key={bump} className={`badge${bump ? ' bump' : ''}`}>{count}</span>;
}

function Header({ search }) {
    const { favCount, cartCount, bumps } = useShop();
    const { pathname } = useLocation();

    return (
        <div id="pravi_header">
            <Link className="logo" to="/" aria-label="Angel Dust — home">
                <span className="logo-mark" aria-hidden="true" />
                <span className="logo-tag">sweet lolita atelier</span>
            </Link>
            <SearchBox search={search} />
            <nav className="header-icons" aria-label="Your pages">
                <ThemeToggle />
                <AccountMenu />
                <Link to="/favourites" className={`icon-link${pathname === '/favourites' ? ' is-active' : ''}`} aria-label={`Favourites, ${plural(favCount, 'item')}`}>
                    <HeartIcon />
                    <Badge count={favCount} bump={bumps.favs} />
                    <span className="icon-label">Favourites</span>
                </Link>
                <Link to="/cart" className={`icon-link${pathname === '/cart' ? ' is-active' : ''}`} aria-label={`Cart, ${plural(cartCount, 'item')}`}>
                    <BagIcon />
                    <Badge count={cartCount} bump={bumps.cart} />
                    <span className="icon-label">Cart</span>
                </Link>
            </nav>
        </div>
    );
}

function AccountMenu() {
    const { user, ready, requireAuth, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDown = e => { if (!ref.current.contains(e.target)) setOpen(false); };
        const onKey = e => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!ready) return null;

    if (!user) {
        return (
            <button type="button" className="icon-link" onClick={() => requireAuth()}>
                <UserIcon />
                <span className="icon-label">Log in</span>
            </button>
        );
    }

    return (
        <div className="account" ref={ref}>
            <button type="button" className="icon-link" aria-expanded={open} aria-label={`Account: ${user.name}`} onClick={() => setOpen(o => !o)}>
                <UserIcon />
                <span className="icon-label">{firstName(user.name)}</span>
            </button>
            {open && (
                <div className="account-menu">
                    <div className="account-hello">
                        Signed in as
                        <FitText as="strong" max={13} min={9}>{user.email}</FitText>
                    </div>
                    <Link to="/favourites" onClick={() => setOpen(false)}>My favourites</Link>
                    <Link to="/cart" onClick={() => setOpen(false)}>My cart</Link>
                    <button type="button" onClick={() => { setOpen(false); logout(); }}>Log out</button>
                </div>
            )}
        </div>
    );
}

// "All pieces" glides down to the grid on the home page; every other category has its own page.
// When the bar is stuck to the top, the search pill fades in on its right.
// On smaller screens the categories move into a hamburger menu and the AD monogram sits in the middle.
function CategoryNav({ stuck, search }) {
    const { categories } = useCatalog();
    const { pathname } = useLocation();
    const active = pathname === '/' ? 'all' : pathname.startsWith('/category/') ? pathname.slice('/category/'.length) : null;
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const barRef = useRef(null);

    // the floating cart bubble sits just under the bar, so share the bar's height with the CSS
    useEffect(() => {
        const bar = barRef.current;
        const observer = new ResizeObserver(() => {
            document.documentElement.style.setProperty('--nav-h', `${bar.offsetHeight}px`);
        });
        observer.observe(bar);
        return () => observer.disconnect();
    }, []);

    // close the menu when the screen grows past the hamburger size
    useEffect(() => {
        const wide = window.matchMedia('(min-width: 901px)');
        const onChange = e => { if (e.matches) setMenuOpen(false); };
        wide.addEventListener('change', onChange);
        return () => wide.removeEventListener('change', onChange);
    }, []);

    return (
        <div id="nav_bar" ref={barRef} className={stuck ? 'is-stuck' : undefined}>
            <div className="nav-inner">
                <button type="button" className="nav-burger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                    <MenuIcon />
                </button>
                <Link to="/" className="nav-monogram" aria-label="Angel Dust — home">
                    <span className="monogram" aria-hidden="true" />
                </Link>
                <nav aria-label="Categories" className="nav-cats">
                    <ul className="categories">
                        {categories.map(c => (
                            <li key={c.id}>
                                <Link
                                    className={`pill${active === c.id ? ' is-active' : ''}`}
                                    to={c.id === 'all' ? '/' : `/category/${c.id}`}
                                    state={c.id === 'all' ? { scrollToShop: true } : undefined}
                                    aria-current={active === c.id ? 'page' : undefined}
                                >
                                    {c.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                {stuck && <SearchBox search={search} className="nav-search" />}
            </div>
            <MobileMenu
                open={menuOpen}
                onClose={closeMenu}
                categories={categories}
                active={active}
                search={stuck ? search : null}
            />
        </div>
    );
}

function Footer() {
    return (
        <footer id="footer">
            <Link to="/" className="footer-logo" aria-label="Angel Dust — home">
                <span className="logo-mark" aria-hidden="true" />
            </Link>
            <nav className="footer-links" aria-label="Footer">
                <Link to="/">Shop</Link>
                <Link to="/favourites">Favourites</Link>
                <Link to="/cart">Cart</Link>
                <a href="#">Size guide</a>
                <a href="#">Shipping &amp; returns</a>
            </nav>
            <p className="footer-small">Made with lace, ribbons &amp; a little bit of love ♡ © {new Date().getFullYear()} Angel Dust</p>
        </footer>
    );
}
