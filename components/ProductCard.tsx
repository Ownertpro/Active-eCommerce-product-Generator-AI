
import React from 'react';
import type { ProductData } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface ProductCardProps {
    data: ProductData;
    imageUrl: string;
    imageUrl2: string;
    areImagesLoading: boolean;
    onSave: () => void;
    isSaving: boolean;
    saveError: string | null;
    saveSuccess: string | null;
    onReset: () => void;
}

const ImageContainer: React.FC<{imageUrl: string, isLoading: boolean, productName: string}> = ({imageUrl, isLoading, productName}) => {
    const loader = (
        <div className="flex flex-col items-center justify-center text-gray-500 w-full h-full">
            <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
        </div>
    );

    const placeholder = (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </div>
    );

    if (imageUrl) {
        return <img src={imageUrl} alt={productName} className="object-contain w-full h-full max-h-48 rounded-lg" />;
    }
    if (isLoading) {
        return loader;
    }
    return placeholder;
}


export const ProductCard: React.FC<ProductCardProps> = ({ data, imageUrl, imageUrl2, areImagesLoading, onSave, isSaving, saveError, saveSuccess, onReset }) => {
    
    const formatCurrency = (amount: number, currencyCode: string) => {
        const locale = currencyCode === 'PYG' ? 'es-PY' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: currencyCode === 'PYG' ? 0 : 2,
        }).format(amount);
    };

    const renderFooterContent = () => {
        if (saveSuccess) {
            return (
                <div className="text-center transition-opacity duration-300 flex flex-col items-center gap-3">
                    <p className="text-green-400 font-medium">{saveSuccess}</p>
                    <button
                        onClick={onReset}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        Generar Nuevo Producto
                    </button>
                </div>
            );
        }

        if (saveError) {
            return (
                <div className="text-center text-sm transition-opacity duration-300 flex flex-col items-center gap-3">
                    <p className="text-red-400 font-medium">{saveError}</p>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600"
                    >
                        {isSaving ? 'Reintentando...' : 'Reintentar'}
                    </button>
                </div>
            );
        }

        return (
            <button
                onClick={onSave}
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500"
            >
                {isSaving ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Guardar en Base de Datos
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden shadow-2xl animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="p-6 md:p-8 flex flex-col">
                    <h2 className="text-3xl font-bold text-white mb-2">{data.productName}</h2>
                    <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-6">
                        {formatCurrency(data.price, data.currency)}
                    </p>

                    <div
                        className="text-gray-300 mb-6 prose prose-invert prose-headings:text-white prose-p:my-2 prose-h3:text-2xl prose-h4:text-xl prose-strong:text-white prose-ul:list-none prose-ul:p-0 prose-li:p-0"
                        dangerouslySetInnerHTML={{ __html: data.description }}
                    />
                    
                    <div className="mb-6">
                         <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Meta Description (SEO)</h4>
                         <p className="text-gray-400 text-sm italic mt-1">{data.metaDescription}</p>
                    </div>
                    
                    <div className="mt-auto pt-6 border-t border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.tags.map((tag, index) => (
                                <span key={index} className="bg-gray-700 text-purple-300 text-xs font-medium px-2.5 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-900 flex items-center justify-center p-6 min-h-[300px] md:min-h-0">
                    <div className="grid grid-cols-2 gap-4 w-full h-full">
                        <div className="flex items-center justify-center bg-gray-800 rounded-lg p-2 aspect-square">
                           <ImageContainer 
                                imageUrl={imageUrl} 
                                isLoading={areImagesLoading && !imageUrl} 
                                productName={data.productName} 
                            />
                        </div>
                         <div className="flex items-center justify-center bg-gray-800 rounded-lg p-2 aspect-square">
                           <ImageContainer 
                                imageUrl={imageUrl2} 
                                isLoading={areImagesLoading && !imageUrl2} 
                                productName={`${data.productName} - vista alternativa`} 
                            />
                        </div>
                    </div>
                </div>
            </div>
             <footer className="p-6 border-t border-gray-700 flex flex-col items-center justify-center gap-4">
                {renderFooterContent()}
             </footer>
             <style jsx>{`
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
