import { useState } from 'react';
import Modal from './Modal.jsx';
import { HeartIcon } from './Icons.jsx';
import { useShop } from '../context/ShopContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { plural } from '../utils.js';

// Asks which collection(s) a favourited piece belongs to.
export default function CollectionModal({ itemId, justAdded, onDone }) {
    const { favs, createCollection, setItemCollections } = useShop();
    const { toast } = useToast();
    const { productById } = useCatalog();
    const product = productById(itemId);
    const [selected, setSelected] = useState(
        () => new Set(favs.collections.filter(c => c.items.includes(itemId)).map(c => c.id))
    );
    const [newName, setNewName] = useState('');

    if (!product) return null;

    const toggle = id => setSelected(s => {
        const next = new Set(s);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });

    // Creates a collection from the text field (if any) and selects it. Returns its id.
    const createFromInput = () => {
        const name = newName.trim();
        if (!name) return null;
        const id = createCollection(name);
        setNewName('');
        setSelected(s => new Set(s).add(id));
        return id;
    };

    return (
        <Modal onClose={onDone}>
            {close => {
                const save = () => {
                    const createdId = createFromInput();
                    const ids = createdId ? [...selected, createdId] : [...selected];
                    setItemCollections(itemId, ids);
                    toast(ids.length ? `Saved to ${plural(ids.length, 'collection')} ♡` : 'Kept in All favourites ♡');
                    close();
                };

                return (
                    <>
                        <div className="modal-icon"><HeartIcon /></div>
                        <h2 id="modal-title">{justAdded ? 'Added to favourites!' : 'Your collections'}</h2>
                        <p className="modal-text">
                            {justAdded
                                ? <>Would you like to add <strong>{product.name}</strong> to an existing collection, or start a new one?</>
                                : <>Choose which collections <strong>{product.name}</strong> belongs to.</>}
                        </p>

                        <div className="collection-options">
                            {favs.collections.length ? favs.collections.map(c => (
                                <label key={c.id} className="col-option">
                                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                                    <span className="col-check" aria-hidden="true">✓</span>
                                    <span className="col-name">{c.name}</span>
                                    <span className="col-count">{plural(c.items.length, 'piece')}</span>
                                </label>
                            )) : (
                                <p className="col-empty">You don't have any collections yet — name your first one below ♡</p>
                            )}
                        </div>

                        <form className="new-col-form" onSubmit={e => { e.preventDefault(); createFromInput(); }}>
                            <input
                                className="field"
                                maxLength={40}
                                placeholder="New collection, e.g. Tea Party"
                                aria-label="New collection name"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <button type="submit" className="btn btn-soft">Create</button>
                        </form>

                        <div className="modal-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => close()}>{justAdded ? 'Not now' : 'Cancel'}</button>
                            <button type="button" className="btn btn-primary" data-autofocus onClick={save}>Save</button>
                        </div>
                    </>
                );
            }}
        </Modal>
    );
}
