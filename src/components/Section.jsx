import React from 'react';
import clsx from 'clsx';

const Section = ({ children, className, title, action }) => {
    return (
        <section className={clsx("mb-8", className)}>
            {(title || action) && (
                <div className="flex justify-between items-end mb-4 px-1">
                    {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
                    {action}
                </div>
            )}
            {children}
        </section>
    );
};

export default Section;
