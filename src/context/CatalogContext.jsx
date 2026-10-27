import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

const CatalogContext = createContext(null);

// Loads categories, products and advertised promo codes from the database once.
export function CatalogProvider({ children }) {
    const [state, setState] = useState({ status: 'loading' });

    const load = useCallback(() => {
        setState({ status: 'loading' });
        api('/catalog')
            .then(data => setState({ status: 'ready', data }))
            .catch(err => setState({ status: 'error', message: err.message }));
    }, []);

    useEffect(() => { load(); }, [load]);

    const value = useMemo(() => {
        if (state.status !== 'ready') return null;
        const { categories, products, promos } = state.data;
        const byId = new Map(products.map(p => [p.id, p]));
        return {
            categories,
            products,
            promos,
            productById: id => byId.get(id),
            promoByCode: code => promos.find(p => p.code === code) || null,
        };
    }, [state]);

    if (!value) {
        return (
            <div className="status-screen">
                <div>
                    <span className="logo-mark" role="img" aria-label="Angel Dust" />
                    {state.status === 'loading' ? (
                        <p className="muted">Laying out the lace…</p>
                    ) : (
                        <>
                            <p className="status-error">{state.message}</p>
                            <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
