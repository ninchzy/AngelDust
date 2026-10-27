const HEART_PATH = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

export const HeartIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d={HEART_PATH} />
    </svg>
);

export const BagIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);

export const SearchIcon = props => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
    </svg>
);

export const UserIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" strokeLinecap="round" {...props}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
);

export const MoonIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
    </svg>
);

// solid centre with eight rounded rays (from the "light mode" reference)
export const SunIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="4.6" fill="currentColor" stroke="none" />
        <path d="M12 1.9V5.6M12 18.4V22.1M1.9 12H5.6M18.4 12H22.1M4.86 4.86L7.47 7.47M16.53 16.53L19.14 19.14M4.86 19.14L7.47 16.53M16.53 7.47L19.14 4.86" />
    </svg>
);

const CHEVRONS = { left: 'M15 18l-6-6 6-6', right: 'M9 6l6 6-6 6', up: 'M6 15l6-6 6 6' };

export const ChevronIcon = ({ direction = 'right', ...props }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
        <path d={CHEVRONS[direction]} />
    </svg>
);

export const MenuIcon = props => (
    <svg viewBox="0 0 24 24" aria-hidden="true" strokeLinecap="round" {...props}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
);
