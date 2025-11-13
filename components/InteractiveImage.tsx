
import React from 'react';
import { TrashIcon } from './icons/TrashIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface InteractiveImageProps {
    imageUrl: string;
    isLoading: boolean;
    productName: string;
    onRegenerate: () => void;
    onDelete: () => void;
}

export const InteractiveImage: React.FC<InteractiveImageProps> = ({ imageUrl, isLoading, productName, onRegenerate, onDelete }) => {
    
    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800 rounded-lg p-2 aspect-square">
                <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
            </div>
        );
    }
    
    if (!imageUrl) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800 rounded-lg p-2 aspect-square">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <button 
                    onClick={onRegenerate}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300"
                >
                    Generar Imagen
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full group bg-gray-800 rounded-lg p-2 aspect-square">
            <img src={imageUrl} alt={productName} className="object-contain w-full h-full rounded-lg" />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
                <button onClick={onRegenerate} title="Regenerar Imagen" className="p-3 bg-gray-700/80 rounded-full text-white hover:bg-purple-600 transition-colors">
                    <RefreshIcon className="w-6 h-6" />
                </button>
                <button onClick={onDelete} title="Eliminar Imagen" className="p-3 bg-gray-700/80 rounded-full text-white hover:bg-red-600 transition-colors">
                    <TrashIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};
