import { useState } from 'react';
import { MoonIcon, SunIcon } from './Icons.jsx';

const STORAGE_KEY = 'angeldust.theme';

// The starting theme is set by the small script in index.html: always light on a fresh visit,
// dark only if it was switched on earlier in this same tab.
const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

export default function ThemeToggle() {
    const [theme, setTheme] = useState(currentTheme);
    const [switched, setSwitched] = useState(false);
    const next = theme === 'dark' ? 'light' : 'dark';
    const label = `Switch to ${next} theme`;

    const toggle = () => {
        const root = document.documentElement;
        root.classList.add('theme-switching');
        root.dataset.theme = next;
        setTimeout(() => root.classList.remove('theme-switching'), 400);
        try { sessionStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
        setTheme(next);
        setSwitched(true);
    };

    // moon while in the light theme, sun while in the dark theme
    const Icon = theme === 'dark' ? SunIcon : MoonIcon;

    return (
        <button type="button" className="icon-link theme-toggle" aria-label={label} onClick={toggle}>
            <Icon key={theme} className={switched ? 'spin-in' : undefined} />
            <span className="tooltip" aria-hidden="true">{label}</span>
        </button>
    );
}
