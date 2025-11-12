
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { categories } from '../data/categories';

interface ProductInputProps {
    productName: string;
    setProductName: (name: string) => void;
    onGenerate: () => void;
    isLoading: boolean;
    error: string | null;
    successMessage: string | null;
    language: 'es' | 'en';
    setLanguage: (lang: 'es' | 'en') => void;
    categoryId: number;
    setCategoryId: (id: number) => void;
    stockQuantity: number;
    setStockQuantity: (qty: number) => void;
}

export const ProductInput: React.FC<ProductInputProps> = ({ 
    productName, setProductName, onGenerate, isLoading, error, successMessage, 
    language, setLanguage, categoryId, setCategoryId, stockQuantity, setStockQuantity
}) => {
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            onGenerate();
        }
    };
    
    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 shadow-lg">
            <div className="flex flex-col gap-4">
                 <div className="flex items-center justify-center">
                     <div className="bg-gray-900 border border-gray-600 rounded-lg p-1 flex" role="group">
                        <button
                            onClick={() => setLanguage('es')}
                            disabled={isLoading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${language === 'es' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}
                            aria-pressed={language === 'es'}
                        >
                            Español
                        </button>
                        <button
                            onClick={() => setLanguage('en')}
                            disabled={isLoading}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${language === 'en' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}
                            aria-pressed={language === 'en'}
                        >
                            Inglés
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <label htmlFor="category-select" className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                        <select
                            id="category-select"
                            value={categoryId}
                            onChange={(e) => setCategoryId(Number(e.target.value))}
                            disabled={isLoading}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        >
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {'\u00A0'.repeat(cat.level * 4)}{cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="stock-quantity" className="block text-sm font-medium text-gray-400 mb-1">Stock</label>
                         <input
                            id="stock-quantity"
                            type="number"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(Number(e.target.value))}
                            min="0"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                            disabled={isLoading}
                        />
                    </div>
                </div>


                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ej: iPhone 15 Pro Max, 256GB"
                        className="w-full flex-grow bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                        disabled={isLoading}
                        aria-label="Nombre del Producto"
                    />
                    <button
                        onClick={onGenerate}
                        disabled={isLoading || !productName.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generando...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-5 h-5" />
                                Generar
                            </>
                        )}
                    </button>
                </div>
            </div>
            {(error || successMessage) && (
                <div className="mt-4 text-center text-sm transition-opacity duration-300">
                    {error && <p className="text-red-400">{error}</p>}
                    {successMessage && <p className="text-green-400">{successMessage}</p>}
                </div>
            )}
        </div>
    );
};
