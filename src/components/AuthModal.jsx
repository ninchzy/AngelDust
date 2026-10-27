import { useState } from 'react';
import Modal from './Modal.jsx';
import { HeartIcon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { firstName } from '../utils.js';

export default function AuthModal({ message, onDone }) {
    const { login, register } = useAuth();
    const { toast } = useToast();
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const field = key => ({ value: form[key], onChange: e => setForm(f => ({ ...f, [key]: e.target.value })) });
    const switchTo = next => { setMode(next); setError(''); };
    const isLogin = mode === 'login';

    return (
        <Modal onClose={onDone}>
            {close => {
                const submit = async e => {
                    e.preventDefault();
                    setBusy(true);
                    setError('');
                    try {
                        const user = isLogin
                            ? await login(form.email, form.password)
                            : await register(form.name, form.email, form.password);
                        toast(isLogin ? `Welcome back, ${firstName(user.name)} ♡` : `Welcome to Angel Dust, ${firstName(user.name)} ♡`);
                        close(true);
                    } catch (err) {
                        setError(err.message);
                        setBusy(false);
                    }
                };

                return (
                    <>
                        <div className="modal-icon"><HeartIcon /></div>
                        <h2 id="modal-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
                        <p className="modal-text">
                            {message || (isLogin
                                ? 'Log in to see your favourites, collections and to check out.'
                                : 'Save favourites, build collections and check out in a heartbeat.')}
                        </p>

                        <form className="auth-form" onSubmit={submit}>
                            {!isLogin && (
                                <label className="auth-field">
                                    <span>Name</span>
                                    <input className="field" autoComplete="name" required maxLength={80} {...field('name')} />
                                </label>
                            )}
                            <label className="auth-field">
                                <span>Email</span>
                                <input className="field" type="email" autoComplete="email" required maxLength={255} data-autofocus {...field('email')} />
                            </label>
                            <label className="auth-field">
                                <span>Password</span>
                                <input
                                    className="field"
                                    type="password"
                                    required
                                    minLength={isLogin ? undefined : 8}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    {...field('password')}
                                />
                            </label>
                            {!isLogin && <p className="auth-hint">At least 8 characters.</p>}
                            {error && <p className="form-error" role="alert">{error}</p>}
                            <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
                                {busy ? 'One moment…' : isLogin ? 'Log in' : 'Create account'}
                            </button>
                        </form>

                        <p className="auth-switch">
                            {isLogin
                                ? <>New here? <button type="button" className="btn-link" onClick={() => switchTo('register')}>Create an account</button></>
                                : <>Already have an account? <button type="button" className="btn-link" onClick={() => switchTo('login')}>Log in</button></>}
                        </p>
                    </>
                );
            }}
        </Modal>
    );
}
