import { useState } from 'react';
import Modal from './Modal.jsx';

export default function Dialog({ title, text, input = false, value = '', placeholder = '', confirm = 'Save', danger = false, onDone }) {
    const [draft, setDraft] = useState(value);

    return (
        <Modal onClose={onDone}>
            {close => (
                <>
                    <h2 id="modal-title">{title}</h2>
                    {text && <p className="modal-text">{text}</p>}
                    <form
                        className="dialog-form"
                        onSubmit={e => {
                            e.preventDefault();
                            if (!input) return close(true);
                            const result = draft.trim();
                            if (result) close(result);
                        }}
                    >
                        {input && (
                            <input
                                className="field"
                                maxLength={40}
                                required
                                data-autofocus
                                value={draft}
                                placeholder={placeholder}
                                aria-label={title}
                                onChange={e => setDraft(e.target.value)}
                            />
                        )}
                        <div className="modal-actions">
                            <button type="button" className="btn btn-ghost" data-autofocus={input ? undefined : true} onClick={() => close(null)}>Cancel</button>
                            <button type="submit" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirm}</button>
                        </div>
                    </form>
                </>
            )}
        </Modal>
    );
}
