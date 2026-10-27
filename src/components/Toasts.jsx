import { useEffect, useState } from 'react';

function Toast({ toast, onDismiss }) {
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setLeaving(true), toast.action ? 5000 : 2600);
        return () => clearTimeout(t);
    }, [toast.action]);

    useEffect(() => {
        if (!leaving) return;
        const t = setTimeout(() => onDismiss(toast.id), 300);
        return () => clearTimeout(t);
    }, [leaving, onDismiss, toast.id]);

    return (
        <div className={`toast${leaving ? ' is-out' : ''}`}>
            <span>{toast.message}</span>
            {toast.action && (
                <button type="button" onClick={() => { toast.action.fn(); setLeaving(true); }}>
                    {toast.action.label}
                </button>
            )}
        </div>
    );
}

export default function Toasts({ toasts, onDismiss }) {
    return (
        <div id="toasts" aria-live="polite">
            {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
        </div>
    );
}
