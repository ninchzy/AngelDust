import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Toasts from '../components/Toasts.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const nextId = useRef(0);

    // toast('Saved ♡') or toast('Removed', { label: 'Undo', fn: () => … })
    const toast = useCallback((message, action) => {
        const id = ++nextId.current;
        setToasts(t => [...t, { id, message, action }]);
    }, []);

    const dismiss = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <Toasts toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
