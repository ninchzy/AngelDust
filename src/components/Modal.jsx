import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Animated modal shell. `children` is a function that receives `close(result)`,
// which plays the closing animation and then calls `onClose(result)`.
// The element marked `data-autofocus` receives focus when the modal opens.
export default function Modal({ onClose, children }) {
    const [open, setOpen] = useState(false);
    const modalRef = useRef(null);
    const closedRef = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const close = useCallback(result => {
        if (closedRef.current) return;
        closedRef.current = true;
        setOpen(false);
        setTimeout(() => onCloseRef.current(result), 260);
    }, []);

    useEffect(() => {
        const lastFocus = document.activeElement;
        document.body.classList.add('modal-open');
        const raf = requestAnimationFrame(() => setOpen(true));
        const onKey = e => { if (e.key === 'Escape') close(null); };
        document.addEventListener('keydown', onKey);
        const first = modalRef.current.querySelector('[data-autofocus]');
        if (first) first.focus();
        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.body.classList.remove('modal-open');
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        };
    }, [close]);

    return createPortal(
        <div
            className={`modal-backdrop${open ? ' is-open' : ''}`}
            onMouseDown={e => { if (e.target === e.currentTarget) close(null); }}
        >
            <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <button type="button" className="modal-close" aria-label="Close" onClick={() => close(null)}>×</button>
                {children(close)}
            </div>
        </div>,
        document.body
    );
}
