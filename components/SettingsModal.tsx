
import React, { useState, useEffect } from 'react';
import { validateApiKey } from '../services/geminiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string, apiUrl: string, categoriesApiUrl: string) => void;
    onShowApiGuide: () => void;
    onShowCategoriesApiGuide: () => void;
    initialApiKey: string;
    initialApiUrl: string;
    initialCategoriesApiUrl: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onSave, onShowApiGuide, onShowCategoriesApiGuide, initialApiKey, initialApiUrl, initialCategoriesApiUrl
}) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [apiUrl, setApiUrl] = useState(initialApiUrl);
    const [categoriesApiUrl, setCategoriesApiUrl] = useState(initialCategoriesApiUrl);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        setApiKey(initialApiKey);
        setApiUrl(initialApiUrl);
        setCategoriesApiUrl(initialCategoriesApiUrl);
        setValidationError(null);
        setIsValidating(false);
    }, [initialApiKey, initialApiUrl, initialCategoriesApiUrl, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
        if (validationError) {
            setValidationError(null);
        }
    };

    const handleSave = async () => {
        setValidationError(null);

        if (apiKey === initialApiKey && apiKey && apiUrl === initialApiUrl && categoriesApiUrl === initialCategoriesApiUrl) {
            onClose();
            return;
        }

        if (!apiKey.trim()) {
            onSave('', apiUrl, categoriesApiUrl);
            onClose();
            return;
        }
        
        setIsValidating(true);
        const isValid = await validateApiKey(apiKey);
        setIsValidating(false);

        if (isValid) {
            onSave(apiKey, apiUrl, categoriesApiUrl);
            onClose();
        } else {
            setValidationError("La clave de API no es válida o no tiene los permisos necesarios.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg flex flex-col shadow-2xl">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Configuración</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
                            Clave de API de Gemini
                        </label>
                        <input
                            id="api-key"
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Introduce tu clave de API"
                            className={`w-full bg-gray-900 border ${validationError ? 'border-red-500' : 'border-gray-600'} rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 ${validationError ? 'focus:ring-red-500' : 'focus:ring-purple-500'}`}
                            aria-invalid={!!validationError}
                            aria-describedby="api-key-error"
                        />
                        {validationError && (
                            <p id="api-key-error" className="text-xs text-red-400 mt-2">{validationError}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            Tu clave de API se guarda localmente en tu navegador.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="api-url" className="block text-sm font-medium text-gray-300 mb-2">
                            URL del Servidor para Guardar (save-product.php)
                        </label>
                        <input
                            id="api-url"
                            type="text"
                            value={apiUrl}
                            onChange={(e) => setApiUrl(e.target.value)}
                            placeholder="https://tudominio.com/save-product.php"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="categories-api-url" className="block text-sm font-medium text-gray-300 mb-2">
                            URL de la API de Categorías (get-categories.php)
                        </label>
                        <input
                            id="categories-api-url"
                            type="text"
                            value={categoriesApiUrl}
                            onChange={(e) => setCategoriesApiUrl(e.target.value)}
                            placeholder="https://tudominio.com/get-categories.php"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <button 
                            onClick={onShowApiGuide}
                            className="text-purple-400 hover:underline text-sm text-left"
                        >
                            Ver / Copiar script del servidor (save-product.php)
                        </button>
                        <button 
                            onClick={onShowCategoriesApiGuide}
                            className="text-purple-400 hover:underline text-sm text-left"
                        >
                            Ver / Copiar script de categorías (get-categories.php)
                        </button>
                    </div>
                </div>

                <footer className="p-4 border-t border-gray-700 flex justify-end items-center gap-4">
                     <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isValidating}
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-wait flex items-center justify-center min-w-[150px]"
                    >
                        {isValidating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Validando...
                            </>
                        ) : 'Guardar Cambios'}
                    </button>
                </footer>
                 <style jsx>{`
                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
};
