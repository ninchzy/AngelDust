import { useRef, useState } from 'react';
import { ChevronIcon } from './Icons.jsx';

// Product photo viewer: big photo with hover arrows (same style as the hero), swipe on touch,
// ←/→ keys when focused, and clickable thumbnails underneath.
export default function Gallery({ photos, name }) {
    const [index, setIndex] = useState(0);
    const drag = useRef(null);
    const count = photos.length;
    const current = Math.min(index, count - 1);
    const go = i => setIndex((i + count) % count);

    if (!count) return <div className="gallery"><div className="gallery-main product-img" /></div>;

    const onPointerUp = e => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current = null;
        if (count > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(current + (dx < 0 ? 1 : -1));
    };

    return (
        <div className="gallery">
            <div
                className="gallery-main slider"
                tabIndex={0}
                aria-roledescription="carousel"
                aria-label={`Photos of ${name}`}
                onKeyDown={e => {
                    if (e.key === 'ArrowRight') go(current + 1);
                    if (e.key === 'ArrowLeft') go(current - 1);
                }}
                onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY }; }}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { drag.current = null; }}
                onDragStart={e => e.preventDefault()}
            >
                <div className="gallery-track" style={{ transform: `translateX(-${current * 100}%)` }}>
                    {photos.map((p, i) => (
                        <div className="gallery-slide product-img" key={p.url} aria-hidden={i !== current}>
                            <img src={p.url} alt={p.alt || name} loading={i === 0 ? 'eager' : 'lazy'} />
                        </div>
                    ))}
                </div>
                {count > 1 && (
                    <>
                        <button type="button" className="slider-arrow slider-arrow--prev" aria-label="Previous photo" onClick={() => go(current - 1)}>
                            <ChevronIcon direction="left" />
                        </button>
                        <button type="button" className="slider-arrow slider-arrow--next" aria-label="Next photo" onClick={() => go(current + 1)}>
                            <ChevronIcon />
                        </button>
                        {/* key: a fresh element per photo, so browser add-ons that rewrite text can't freeze it */}
                        <span key={current} className="gallery-count" aria-live="polite">{`${current + 1} / ${count}`}</span>
                    </>
                )}
            </div>

            {count > 1 && (
                <div className="gallery-thumbs">
                    {photos.map((p, i) => (
                        <button
                            key={p.url}
                            type="button"
                            className={`gallery-thumb product-img${i === current ? ' is-active' : ''}`}
                            aria-label={`Show photo ${i + 1}`}
                            aria-current={i === current}
                            onClick={() => setIndex(i)}
                        >
                            <img src={p.url} alt="" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
