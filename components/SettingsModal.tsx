
import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string, apiUrl: string) => void;
    onShowApiGuide: () => void;
    initialApiKey: string;
    initialApiUrl: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, onSave, onShowApiGuide, initialApiKey, initialApiUrl 
}) => {
    const [apiKey, setApiKey] = useState(initialApiKey);
    const [apiUrl, setApiUrl] = useState(initialApiUrl);

    useEffect(() => {
        setApiKey(initialApiKey);
        setApiUrl(initialApiUrl);
    }, [initialApiKey, initialApiUrl, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        onSave(apiKey, apiUrl);
        onClose();
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
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Introduce tu clave de API"
                            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Tu clave de API se guarda localmente en tu navegador.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="api-url" className="block text-sm font-medium text-gray-300 mb-2">
                            URL del Servidor para Guardar
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
                        <button 
                            onClick={onShowApiGuide}
                            className="text-purple-400 hover:underline text-sm"
                        >
                            Ver / Copiar script del servidor (save-product.php)
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
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700"
                    >
                        Guardar Cambios
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
