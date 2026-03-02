import React from 'react';

const SikanLogo = ({ className = "w-10 h-10", fill = "currentColor" }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M50 85C45 85 41 81 41 75C41 68 45 62 55 58C65 54 75 48 75 35C75 22 65 15 50 15C38 15 31 22 31 22L36 29C36 29 42 24 50 24C58 24 64 28 64 35C64 42 58 46 48 50C38 54 30 60 30 75C30 86 38 95 50 95C62 95 68 89 68 89L63 82C63 82 58 85 50 85Z"
                fill={fill}
                stroke={fill}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SikanLogo;
