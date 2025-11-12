
import React from 'react';

export const Loader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-400">La IA está trabajando...</p>
        </div>
    );
};
