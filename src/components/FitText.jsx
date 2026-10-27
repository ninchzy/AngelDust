import { useLayoutEffect, useRef } from 'react';

// One line of text that shrinks (from `max` down to `min` px) until it fits its box.
export default function FitText({ children, max = 13, min = 9, as: Tag = 'span', className = '' }) {
    const ref = useRef(null);

    useLayoutEffect(() => {
        const el = ref.current;
        const fit = () => {
            let size = max;
            el.style.fontSize = `${size}px`;
            while (el.scrollWidth > el.clientWidth && size > min) {
                size -= 0.5;
                el.style.fontSize = `${size}px`;
            }
        };
        fit();
        document.fonts?.ready.then(fit);
    }, [children, max, min]);

    return (
        <Tag ref={ref} className={`fit-text ${className}`.trim()} title={typeof children === 'string' ? children : undefined}>
            {children}
        </Tag>
    );
}
