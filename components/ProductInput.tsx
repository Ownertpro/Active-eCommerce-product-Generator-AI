
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import type { Category } from '../types';

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
    tone: string;
    setTone: (tone: string) => void;
    temperature: number;
    setTemperature: (temp: number) => void;
    imageStyle: string;
    setImageStyle: (style: string) => void;
    aspectRatio: '1:1' | '4:3' | '16:9';
    setAspectRatio: (ratio: '1:1' | '4:3' | '16:9') => void;
    categories: Category[];
    isCategoriesLoading: boolean;
    categoriesError: string | null;
}

export const ProductInput: React.FC<ProductInputProps> = ({ 
    productName, setProductName, onGenerate, isLoading, error, successMessage, 
    language, setLanguage, categoryId, setCategoryId, stockQuantity, setStockQuantity,
    tone, setTone, temperature, setTemperature, imageStyle, setImageStyle, aspectRatio, setAspectRatio,
    categories, isCategoriesLoading, categoriesError
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
                            disabled={isLoading || isCategoriesLoading || !!categoriesError}
                            className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${categoriesError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-purple-500'}`}
                            aria-invalid={!!categoriesError}
                            aria-describedby="category-error"
                        >
                            {isCategoriesLoading && <option>Cargando categorías...</option>}
                            {!isCategoriesLoading && !categoriesError && categories.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {'\u00A0'.repeat(cat.level * 4)}{cat.name}
                                </option>
                            ))}
                        </select>
                        {categoriesError && <p id="category-error" className="text-red-400 text-xs mt-1">{categoriesError}</p>}
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

            <details className="mt-4 group">
                <summary className="list-none flex items-center gap-2 cursor-pointer text-gray-400 hover:text-white transition-colors">
                    <span>Opciones Avanzadas</span>
                    <svg className="w-4 h-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </summary>
                <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                    <div>
                        <label htmlFor="tone-select" className="block text-sm font-medium text-gray-400 mb-1">Tono de la Descripción</label>
                        <select
                            id="tone-select"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="persuasive">Persuasivo</option>
                            <option value="professional">Profesional</option>
                            <option value="friendly">Amistoso</option>
                            <option value="technical">Técnico</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-400 mb-1">
                            Creatividad: <span className="font-bold text-purple-400">{temperature}</span>
                        </label>
                        <input
                            id="temperature-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            disabled={isLoading}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                     <div>
                        <label htmlFor="style-select" className="block text-sm font-medium text-gray-400 mb-1">Estilo de Imagen</label>
                        <select
                            id="style-select"
                            value={imageStyle}
                            onChange={(e) => setImageStyle(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="studio">Foto de Estudio</option>
                            <option value="lifestyle">Estilo de Vida</option>
                            <option value="minimalist">Minimalista</option>
                            <option value="closeup">Primer Plano (Detalles)</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="ratio-select" className="block text-sm font-medium text-gray-400 mb-1">Relación de Aspecto</label>
                        <select
                            id="ratio-select"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as '1:1' | '4:3' | '16:9')}
                            disabled={isLoading}
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="1:1">Cuadrado (1:1)</option>
                            <option value="4:3">Paisaje (4:3)</option>
                            <option value="16:9">Panorámico (16:9)</option>
                        </select>
                    </div>
                </div>
            </details>

            {(error || successMessage) && (
                <div className="mt-4 text-center text-sm transition-opacity duration-300">
                    {error && <p className="text-red-400">{error}</p>}
                    {successMessage && <p className="text-green-400">{successMessage}</p>}
                </div>
            )}
             <style jsx>{`
                details[open] .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .accent-purple-500 {
                    accent-color: #8b5cf6;
                }
            `}</style>
        </div>
    );
};
