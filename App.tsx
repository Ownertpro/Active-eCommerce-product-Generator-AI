
import React, { useState, useCallback, useEffect } from 'react';
import { ProductInput } from './components/ProductInput';
import { ProductCard } from './components/ProductCard';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { generateProductDetails, generateProductImage } from './services/geminiService';
import type { ProductData, ApiResponse } from './types';
import { ApiGuide } from './components/ApiGuide';
import { SettingsModal } from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';

// FIX: Resolved conflicting global type declarations for `window.aistudio` by using a named interface `AIStudio`.
// This allows TypeScript to merge declarations from different sources correctly.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        // FIX: Made `aistudio` optional to resolve "All declarations of 'aistudio' must have identical modifiers" error.
        // This can happen if another declaration (e.g., in a library's .d.ts file) also defines `aistudio` but as optional.
        aistudio?: AIStudio;
    }
}


/**
 * Comprime una imagen codificada en base64. La redimensiona a un tamaño máximo
 * y la convierte a formato JPEG para optimizar su peso.
 * @param base64Str La imagen original en formato base64.
 * @param quality La calidad del JPEG resultante (0 a 1).
 * @returns Una promesa que se resuelve con la nueva imagen comprimida en base64.
 */
const compressImage = (base64Str: string, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let { width, height } = img;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('No se pudo obtener el contexto del canvas.'));
            }
            ctx.drawImage(img, 0, 0, width, height);
            // Convertir a JPEG para una mejor compresión de imágenes fotográficas
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => {
            console.error("Error al cargar la imagen para compresión", err);
            reject(new Error('No se pudo cargar la imagen para la compresión.'));
        };
    });
};

/**
 * A screen that prompts the user to select their API key before using the app.
 */
const ApiKeySelectionScreen: React.FC<{ onSelectKey: () => void; onOpenSettings: () => void }> = ({ onSelectKey, onOpenSettings }) => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-lg">
             <SparklesIcon className="w-12 h-12 mx-auto text-purple-400 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Se requiere una Clave de API</h1>
            <p className="text-gray-400 mb-6">
                 Para usar esta aplicación, por favor seleccione una clave de API de Google AI Studio o ingrese una manualmente.
            </p>
            <div className="space-y-4">
                 {window.aistudio && (
                    <button
                        onClick={onSelectKey}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                    >
                        Usar Clave de Google AI Studio
                    </button>
                )}
                 <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-500"
                >
                    Ingresar Clave Manualmente
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
                Asegúrese de que su clave tenga la facturación habilitada. Para más información, visite la{' '}
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    documentación de facturación de la API de Gemini
                </a>.
            </p>
        </div>
    </div>
);


export const App: React.FC = () => {
    const [productName, setProductName] = useState('');
    const [language, setLanguage] = useState<'es' | 'en'>('es');
    const [categoryId, setCategoryId] = useState<number>(1);
    const [stockQuantity, setStockQuantity] = useState<number>(10);
    const [generatedData, setGeneratedData] = useState<ProductData | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageUrl2, setImageUrl2] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
    const [showApiGuide, setShowApiGuide] = useState<boolean>(false);

    const [userApiKey, setUserApiKey] = useState<string>('');
    const [apiUrl, setApiUrl] = useState<string>('https://compraspar.com/save-product.php');
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
    
    // On component mount, check for keys
    useEffect(() => {
        const localApiKey = localStorage.getItem('gemini_api_key');
        const localApiUrl = localStorage.getItem('product_api_url');
        
        if (localApiUrl) {
            setApiUrl(localApiUrl);
        }

        const checkApiKey = async () => {
            if (localApiKey) {
                setUserApiKey(localApiKey);
                setApiKeyReady(true);
            } else if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeyReady(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume success to handle potential race condition where hasSelectedApiKey is not immediately true.
            setApiKeyReady(true);
            setError(null); // Clear previous errors after selecting a new key
        }
    };

    const handleSaveSettings = (newApiKey: string, newApiUrl: string) => {
        localStorage.setItem('gemini_api_key', newApiKey);
        localStorage.setItem('product_api_url', newApiUrl);
        setUserApiKey(newApiKey);
        setApiUrl(newApiUrl);
        if (newApiKey) {
            setApiKeyReady(true);
        }
        setError(null);
    };

    const handleProductNameChange = (name: string) => {
        setProductName(name);
        if (error) setError(null);
        if (successMessage) setSuccessMessage(null);
    };

    const handleGenerate = useCallback(async () => {
        if (!productName.trim()) {
            setError('Por favor, ingrese un nombre de producto.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setGeneratedData(null);
        setImageUrl('');
        setImageUrl2('');
        setSaveError(null);
        setSaveSuccess(null);
        setShowApiGuide(false);

        try {
            // Generate text details first
            const details = await generateProductDetails(productName, language, userApiKey);
            setGeneratedData(details);

            // Generate images in parallel
            const [image1Result, image2Result] = await Promise.allSettled([
                details.imagePrompt ? generateProductImage(details.imagePrompt, userApiKey) : Promise.reject(new Error('No se generó prompt para la imagen 1')),
                details.imagePrompt2 ? generateProductImage(details.imagePrompt2, userApiKey) : Promise.reject(new Error('No se generó prompt para la imagen 2'))
            ]);

            if (image1Result.status === 'fulfilled') {
                const compressedUrl = await compressImage(image1Result.value);
                setImageUrl(compressedUrl);
            } else {
                console.error("Error generando imagen 1:", image1Result.reason);
            }

            if (image2Result.status === 'fulfilled') {
                const compressedUrl = await compressImage(image2Result.value);
                setImageUrl2(compressedUrl);
            } else {
                console.error("Error generando imagen 2:", image2Result.reason);
            }

            setSuccessMessage('¡Producto generado con éxito!');

        } catch (e: any) {
            console.error(e);
            const errorMessage = e.message || 'Ocurrió un error al generar los datos. Por favor, intente de nuevo.';
             // If permission is denied, prompt the user to select an API key again.
            if (e.toString().includes('PERMISSION_DENIED') || e.toString().includes('API key not valid') || e.message.includes('API key not found')) {
                setError('Error de permiso o clave de API inválida. Por favor, verifique su clave en la configuración o seleccione una nueva clave de AI Studio.');
                setApiKeyReady(false);
            } else {
                setError(errorMessage);
            }
            setGeneratedData(null);
        } finally {
            setIsLoading(false);
        }
    }, [productName, language, userApiKey]);

    const handleSaveToDatabase = useCallback(async () => {
        if (!generatedData || (!imageUrl && !imageUrl2)) {
            setSaveError("No hay suficientes datos de producto para guardar.");
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);
        setShowApiGuide(false);

        const payload: ApiResponse = {
            categoryId: categoryId,
            stockQuantity: stockQuantity,
            productName: generatedData.productName,
            description: generatedData.description,
            metaDescription: generatedData.metaDescription,
            tags: generatedData.tags,
            price: generatedData.price,
            currency: generatedData.currency,
            imageUrl1: imageUrl,
            imageUrl2: imageUrl2,
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();

            if (!response.ok) {
                 if (response.status === 500 && !responseText.trim()) {
                    setSaveError("El script del servidor falló. Sigue la guía para solucionarlo.");
                    setShowApiGuide(true);
                    return;
                }
                
                let errorMessage = `Error del servidor (${response.status}).`;
                try {
                    const errorJson = JSON.parse(responseText);
                    errorMessage = errorJson.error || `Respuesta inesperada del servidor: ${responseText}`;
                } catch (jsonError) {
                    errorMessage = `Error del servidor (${response.status}): ${responseText}`;
                }
                setSaveError(errorMessage);
                return;
            }
            
            const result = JSON.parse(responseText);
            if (result.ok) {
                setSaveSuccess('¡Producto guardado en la base de datos con éxito!');
            } else {
                setSaveError(result.error || 'El servidor indicó un fallo al guardar.');
            }

        } catch (e: any) {
            console.error("Error saving product:", e);
            let errorMessage = "Ocurrió un error desconocido al guardar.";
            if (e instanceof TypeError && e.message === 'Failed to fetch') {
                errorMessage = "Error de red o CORS. Asegúrese de que el servidor esté configurado para aceptar peticiones desde este origen.";
            } else if (e.message) {
                errorMessage = e.message;
            }
            setSaveError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [generatedData, imageUrl, imageUrl2, categoryId, stockQuantity, apiUrl]);

    const handleReset = useCallback(() => {
        setProductName('');
        setGeneratedData(null);
        setImageUrl('');
        setImageUrl2('');
        setError(null);
        setSuccessMessage(null);
        setSaveError(null);
        setSaveSuccess(null);
        setIsSaving(false);
        setIsLoading(false);
        setShowApiGuide(false);
    }, []);

    // If the API key is not ready, show the selection screen.
    if (!apiKeyReady) {
        return (
            <>
                <ApiKeySelectionScreen 
                    onSelectKey={handleSelectKey} 
                    onOpenSettings={() => setIsSettingsOpen(true)} 
                />
                 <SettingsModal 
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onSave={handleSaveSettings}
                    onShowApiGuide={() => {
                        setIsSettingsOpen(false);
                        setShowApiGuide(true);
                    }}
                    initialApiKey={userApiKey}
                    initialApiUrl={apiUrl}
                />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSaveSettings}
                onShowApiGuide={() => {
                    setIsSettingsOpen(false);
                    setShowApiGuide(true);
                }}
                initialApiKey={userApiKey}
                initialApiUrl={apiUrl}
            />
            {showApiGuide && <ApiGuide onClose={() => setShowApiGuide(false)} />}
            <div className="w-full max-w-4xl mx-auto">
                <header className="relative text-center mb-8">
                     <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Configuración"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 flex items-center justify-center gap-3">
                        <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        Generador de Productos
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">
                        Crea descripciones, precios e imágenes de productos al instante con IA.
                    </p>
                </header>

                <main className="flex flex-col gap-8">
                    <ProductInput
                        productName={productName}
                        setProductName={handleProductNameChange}
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                        error={error}
                        successMessage={successMessage}
                        language={language}
                        setLanguage={setLanguage}
                        categoryId={categoryId}
                        setCategoryId={setCategoryId}
                        stockQuantity={stockQuantity}
                        setStockQuantity={setStockQuantity}
                    />

                    {isLoading && !generatedData && <Loader />}

                    {!isLoading && !generatedData && !error && (
                        <div className="text-center text-gray-500 py-10">
                            <p>Ingrese el nombre de un producto para comenzar.</p>
                        </div>
                    )}

                    {generatedData && (
                        <ProductCard
                            data={generatedData}
                            imageUrl={imageUrl}
                            imageUrl2={imageUrl2}
                            areImagesLoading={isLoading}
                            onSave={handleSaveToDatabase}
                            isSaving={isSaving}
                            saveError={saveError}
                            saveSuccess={saveSuccess}
                            onReset={handleReset}
                        />
                    )}
                </main>
                 <footer className="text-center mt-12 text-gray-600 text-sm">
                    <p>Desarrollado con React, Tailwind CSS y la API de Gemini.</p>
                </footer>
            </div>
        </div>
    );
};
