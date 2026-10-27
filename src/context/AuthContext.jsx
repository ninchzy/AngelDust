import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useToast } from './ToastContext.jsx';
import AuthModal from '../components/AuthModal.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const { toast } = useToast();
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const [prompt, setPrompt] = useState(null);
    const userRef = useRef(null);
    const promptRef = useRef(null);
    userRef.current = user;

    useEffect(() => {
        let alive = true;
        api('/auth/me')
            .then(data => { if (alive) setUser(data.user); })
            .catch(() => {})
            .finally(() => { if (alive) setReady(true); });
        return () => { alive = false; };
    }, []);

    const login = async (email, password) => {
        const data = await api('/auth/login', { method: 'POST', body: { email, password } });
        setUser(data.user);
        return data.user;
    };

    const register = async (name, email, password) => {
        const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        try { await api('/auth/logout', { method: 'POST' }); } catch { /* cookie is cleared server-side when reachable */ }
        setUser(null);
        toast('You\'re logged out. See you soon ♡');
    };

    // Called when the server says the session is gone.
    const sessionExpired = useCallback(() => setUser(null), []);

    // Resolves true once the visitor is logged in (asking them if needed), false if they back out.
    const requireAuth = useCallback(message => {
        if (userRef.current) return Promise.resolve(true);
        return new Promise(resolve => {
            if (promptRef.current) promptRef.current.resolve(false);
            const next = { message, resolve, id: Date.now() };
            promptRef.current = next;
            setPrompt(next);
        });
    }, []);

    const finishPrompt = ok => {
        prompt.resolve(!!ok);
        promptRef.current = null;
        setPrompt(null);
    };

    return (
        <AuthContext.Provider value={{ user, ready, login, register, logout, requireAuth, sessionExpired }}>
            {children}
            {prompt && <AuthModal key={prompt.id} message={prompt.message} onDone={finishPrompt} />}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
