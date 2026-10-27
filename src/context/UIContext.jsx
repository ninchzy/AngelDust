import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Dialog from '../components/Dialog.jsx';
import CollectionModal from '../components/CollectionModal.jsx';

const UIContext = createContext(null);

export function UIProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const [collectionsFor, setCollectionsFor] = useState(null);
    const nextId = useRef(0);

    // Small reusable dialog: resolves to the typed text, true (confirm), or null (cancelled).
    const openDialog = useCallback(options => new Promise(resolve => {
        setDialog({ ...options, resolve, id: ++nextId.current });
    }), []);

    const openCollections = useCallback((itemId, justAdded) => {
        setCollectionsFor({ itemId, justAdded, id: ++nextId.current });
    }, []);

    return (
        <UIContext.Provider value={{ openDialog, openCollections }}>
            {children}
            {dialog && (
                <Dialog
                    key={dialog.id}
                    {...dialog}
                    onDone={result => { dialog.resolve(result ?? null); setDialog(null); }}
                />
            )}
            {collectionsFor && (
                <CollectionModal
                    key={collectionsFor.id}
                    itemId={collectionsFor.itemId}
                    justAdded={collectionsFor.justAdded}
                    onDone={() => setCollectionsFor(null)}
                />
            )}
        </UIContext.Provider>
    );
}

export const useUI = () => useContext(UIContext);
