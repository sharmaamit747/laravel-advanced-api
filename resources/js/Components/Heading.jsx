import { Link } from '@inertiajs/react';

export default function Heading({
    as: Tag = 'h1',
    title = '',
    active = false,
    className = '',
    children,
    ...props
}) {
    // Tailwind classes for each heading tag
    const headingStyles = {
        h1: 'text-4xl font-bold mb-4',
        h2: 'text-3xl font-semibold mb-3',
        h3: 'text-2xl font-semibold mb-2.5',
        h4: 'text-xl font-medium mb-2',
        h5: 'text-lg font-medium mb-1.5',
        h6: 'text-base font-medium mb-1',
    };

    const base = `inline-flex items-center border-b-2 px-0 pt-1 leading-5 transition duration-150 ease-in-out 
        border-transparent text-gray-600 hover:text-gray-800`;

    const styles = `${base} ${headingStyles[Tag] || ''} ${className}`;

    return (
        <Tag className={styles} {...props}>
            {title || children}
        </Tag>
    );
}
