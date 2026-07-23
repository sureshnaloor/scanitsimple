'use client';

import { Loader2 } from 'lucide-react';

interface LoadingProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function Loading({ 
    message = 'Loading...', 
    size = 'md',
    className = ''
}: LoadingProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8'
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Loader2 className={`animate-spin text-blue-600 dark:text-blue-400 ${sizeClasses[size]}`} />
            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        </div>
    );
}
