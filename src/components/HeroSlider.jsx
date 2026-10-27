import { useRef, useState } from 'react';
import { ChevronIcon } from './Icons.jsx';

// Full-width slider. Arrows appear on hover (desktop); swipe + dots work everywhere.
export default function HeroSlider({ slides, label = 'Featured' }) {
    const [index, setIndex] = useState(0);
    const count = slides.length;
    const drag = useRef(null);
    const swiped = useRef(false);

    const go = i => setIndex((i + count) % count);

    const onPointerDown = e => {
        drag.current = { x: e.clientX, y: e.clientY };
        swiped.current = false;
    };

    const onPointerUp = e => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current = null;
        if (count > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            swiped.current = true;
            go(index + (dx < 0 ? 1 : -1));
        }
    };

    // a swipe that ends on the promo slide shouldn't also count as a click on it
    const onClickCapture = e => {
        if (!swiped.current) return;
        e.preventDefault();
        e.stopPropagation();
        swiped.current = false;
    };

    return (
        <section className="hero slider theme-light" aria-roledescription="carousel" aria-label={label}>
            <div
                className="hero-viewport"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { drag.current = null; }}
                onClickCapture={onClickCapture}
                onDragStart={e => e.preventDefault()}
            >
                {/* invisible strips along both edges, under the arrows: a near-miss on an
                    arrow lands here instead of opening the clickable promo slide */}
                <div className="hero-guard hero-guard--left" aria-hidden="true" />
                <div className="hero-guard hero-guard--right" aria-hidden="true" />
                <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
                    {slides.map((slide, i) => (
                        <div
                            key={i}
                            className="hero-slide-wrap"
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${count}`}
                            aria-hidden={i !== index}
                            inert={i !== index}
                        >
                            {slide}
                        </div>
                    ))}
                </div>
            </div>

            {count > 1 && (
                <>
                    <button type="button" className="slider-arrow slider-arrow--prev" aria-label="Previous slide" onClick={() => go(index - 1)}>
                        <ChevronIcon direction="left" />
                    </button>
                    <button type="button" className="slider-arrow slider-arrow--next" aria-label="Next slide" onClick={() => go(index + 1)}>
                        <ChevronIcon />
                    </button>
                    <div className="hero-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`hero-dot${i === index ? ' is-active' : ''}`}
                                aria-label={`Show slide ${i + 1}`}
                                aria-current={i === index}
                                onClick={() => go(i)}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
