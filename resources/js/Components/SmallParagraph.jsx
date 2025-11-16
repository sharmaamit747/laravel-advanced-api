export default function SmallParagraph({
    title,
    className = '',
    children,
    ...props
}) {
    return (
        <p
            {...props}
            className={
                `block text-sm font-small text-gray-700 ` +
                className
            }
        >
            {title ? title : children}
        </p>
    );
}
