export default function EmptyState({ icon, title, text, children, style }) {
    return (
        <div className="empty-state" style={style}>
            {icon}
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}
