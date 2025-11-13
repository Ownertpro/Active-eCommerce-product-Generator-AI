

import React, { useState, useCallback, useEffect } from 'react';
import { ProductInput } from './components/ProductInput';
import { ProductCard } from './components/ProductCard';
import { Loader } from './components/Loader';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { generateProductDetails, generateProductImage } from './services/geminiService';
import type { ProductData, ApiResponse, Category } from './types';
import { ApiGuide } from './components/ApiGuide';
import { SettingsModal } from './components/SettingsModal';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { CategoriesApiGuide } from './components/CategoriesApiGuide';

// FIX: Resolved conflicting global type declarations for `window.aistudio` by using a named interface `AIStudio`.
// This allows TypeScript to merge declarations from different sources correctly.
// FIX: Made `aistudio` optional to resolve "All declarations of 'aistudio' must have identical modifiers" error.
// This can happen if another declaration (e.g., in a library's .d.ts file) also defines `aistudio` but as optional.
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

/**
 * Obtiene el estado inicial de una clave del localStorage o devuelve un valor por defecto.
 * @param key La clave del localStorage.
 * @param defaultValue El valor por defecto si la clave no existe o hay un error.
 * @returns El valor parseado del localStorage o el valor por defecto.
 */
const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error al leer la clave “${key}” del localStorage:`, error);
        return defaultValue;
    }
};


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
const ApiKeySelectionScreen: React.FC<{ 
    onSelectKey: () => void; 
    onOpenSettings: () => void;
    error?: string | null;
    onDismissError: () => void;
}> = ({ onSelectKey, onOpenSettings, error, onDismissError }) => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-lg">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6 text-left" role="alert">
                    <strong className="font-bold block mb-1">Error de API</strong>
                    <span className="block">{error}</span>
                    <button onClick={onDismissError} className="absolute top-0.5 right-0.5 p-2" aria-label="Cerrar">
                        <svg className="fill-current h-5 w-5 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Cerrar</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </button>
                </div>
            )}
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
    const [purchasePrice, setPurchasePrice] = useState<number>(0);
    const [unit, setUnit] = useState<string>('UNI');
    const [generatedData, setGeneratedData] = useState<ProductData | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [imageUrl2, setImageUrl2] = useState<string>('');
    const [isGeneratingDetails, setIsGeneratingDetails] = useState<boolean>(false);
    const [isImage1Loading, setIsImage1Loading] = useState<boolean>(false);
    const [isImage2Loading, setIsImage2Loading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Opciones de generación con persistencia en localStorage
    const [tone, setTone] = useState<string>(() => getInitialState('gen_tone', 'persuasive'));
    const [temperature, setTemperature] = useState<number>(() => getInitialState('gen_temperature', 0.8));
    const [imageStyle, setImageStyle] = useState<string>(() => getInitialState('gen_imageStyle', 'studio'));
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9'>(() => getInitialState('gen_aspectRatio', '1:1'));

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    const [apiKeyReady, setApiKeyReady] = useState<boolean>(false);
    const [showApiGuide, setShowApiGuide] = useState<boolean>(false);
    const [showCategoriesApiGuide, setShowCategoriesApiGuide] = useState<boolean>(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

    // Estado para la configuración de la API y las categorías
    const [userApiKey, setUserApiKey] = useState<string>('');
    const [apiUrl, setApiUrl] = useState<string>('https://compraspar.com/save-product.php');
    const [categoriesApiUrl, setCategoriesApiUrl] = useState<string>('https://compraspar.com/get-categories.php');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoriesLoading, setIsCategoriesLoading] = useState<boolean>(true);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);
    
    // On component mount, check for keys and URLs
    useEffect(() => {
        const localApiKey = localStorage.getItem('gemini_api_key');
        const localApiUrl = localStorage.getItem('product_api_url');
        const localCategoriesApiUrl = localStorage.getItem('categories_api_url');
        
        if (localApiUrl) setApiUrl(localApiUrl);
        if (localCategoriesApiUrl) setCategoriesApiUrl(localCategoriesApiUrl);

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

    // Fetch categories when the component mounts or the API URL changes
    useEffect(() => {
        const fetchCategories = async () => {
            if (!categoriesApiUrl) {
                setCategoriesError("Configure la URL de la API de categorías.");
                setIsCategoriesLoading(false);
                setCategories([]);
                return;
            }
            setIsCategoriesLoading(true);
            setCategoriesError(null);
            setShowCategoriesApiGuide(false);
            try {
                const response = await fetch(categoriesApiUrl);
                
                if (!response.ok) {
                    const status = response.status;
                    // Intenta leer el cuerpo del error para obtener un mensaje más detallado.
                    try {
                        const errorData = await response.json();
                        // Si el script PHP envía un error JSON, lo usamos.
                        throw new Error(errorData.error || `Error del servidor: ${status}`);
                    } catch (e) {
                        // Si el cuerpo no es JSON o hay otro error, usamos el estado HTTP.
                        throw new Error(`Error del servidor: ${status}`);
                    }
                }

                const result = await response.json();
                if (result.ok && Array.isArray(result.data)) {
                    setCategories(result.data);
                } else {
                    throw new Error(result.error || 'Respuesta inesperada de la API.');
                }
            } catch (error: any) {
                console.error("Error al cargar categorías:", error);
                 if (error.message.includes('500')) {
                    setShowCategoriesApiGuide(true);
                }
                setCategoriesError(error.message || "No se pudieron cargar las categorías. Verifique la URL.");
                setCategories([]);
            } finally {
                setIsCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, [categoriesApiUrl]);

    // Persistir las opciones de generación en localStorage cuando cambien
    useEffect(() => {
        try {
            localStorage.setItem('gen_tone', JSON.stringify(tone));
            localStorage.setItem('gen_temperature', JSON.stringify(temperature));
            localStorage.setItem('gen_imageStyle', JSON.stringify(imageStyle));
            localStorage.setItem('gen_aspectRatio', JSON.stringify(aspectRatio));
        } catch (error) {
            console.error("No se pudieron guardar las configuraciones en localStorage", error);
        }
    }, [tone, temperature, imageStyle, aspectRatio]);


    const handleSelectKey = async () => {
        if (window.aistudio) {
            setError(null);
            await window.aistudio.openSelectKey();
            setApiKeyReady(true);
        }
    };
    
    const handleOpenSettings = () => {
        setError(null);
        setIsSettingsOpen(true);
    };

    const handleSaveSettings = (newApiKey: string, newApiUrl: string, newCategoriesApiUrl: string) => {
        localStorage.setItem('gemini_api_key', newApiKey);
        localStorage.setItem('product_api_url', newApiUrl);
        localStorage.setItem('categories_api_url', newCategoriesApiUrl);
        
        setUserApiKey(newApiKey);
        setApiUrl(newApiUrl);
        setCategoriesApiUrl(newCategoriesApiUrl);

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
    
    const handleDataChange = (field: keyof ProductData, value: string | number | string[]) => {
        setGeneratedData(prevData => {
            if (!prevData) return null;
            return { ...prevData, [field]: value };
        });
    };

    const handleGenerate = useCallback(async () => {
        if (!productName.trim()) {
            setError('Por favor, ingrese un nombre de producto.');
            return;
        }

        setIsGeneratingDetails(true);
        setError(null);
        setSuccessMessage(null);
        setGeneratedData(null);
        setImageUrl('');
        setImageUrl2('');
        setSaveError(null);
        setSaveSuccess(null);
        setShowApiGuide(false);

        try {
            const details = await generateProductDetails(productName, language, userApiKey, tone, temperature);
            setGeneratedData(details);
            setSuccessMessage('¡Detalles generados! Ahora generando imágenes...');

            if (details.imagePrompt) {
                setIsImage1Loading(true);
                generateProductImage(details.imagePrompt, userApiKey, imageStyle, aspectRatio)
                    .then(compressImage)
                    .then(setImageUrl)
                    .catch(e => {
                        console.error("Error generating image 1:", e);
                        setError(prev => prev ? `${prev}\nError Imagen 1: ${e.message}` : `Error Imagen 1: ${e.message}`);
                    })
                    .finally(() => setIsImage1Loading(false));
            }

            if (details.imagePrompt2) {
                setIsImage2Loading(true);
                generateProductImage(details.imagePrompt2, userApiKey, imageStyle, aspectRatio)
                    .then(compressImage)
                    .then(setImageUrl2)
                    .catch(e => {
                        console.error("Error generating image 2:", e);
                        setError(prev => prev ? `${prev}\nError Imagen 2: ${e.message}` : `Error Imagen 2: ${e.message}`);
                    })
                    .finally(() => setIsImage2Loading(false));
            }

        } catch (e: any) {
            console.error(e);
            const errorMessage = e.message || 'Ocurrió un error al generar los datos.';
            
            const isApiKeyError = 
                e.toString().includes('PERMISSION_DENIED') ||
                e.toString().includes('API key not valid') ||
                e.message.includes('API key not found') ||
                e.message.includes('Error de cuota de API');

            if (isApiKeyError) {
                let specificError = 'Error de permiso o clave de API inválida. Verifique su clave.';
                if (e.message.includes('Error de cuota de API')) {
                    specificError = 'Error de cuota (429). Verifique la facturación de su clave en Google AI Studio.';
                }
                setError(specificError);
                setApiKeyReady(false);
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsGeneratingDetails(false);
        }
    }, [productName, language, userApiKey, tone, temperature, imageStyle, aspectRatio]);

    const handleRegenerateImage = useCallback(async (imageNumber: 1 | 2) => {
        if (!generatedData) return;

        const prompt = imageNumber === 1 ? generatedData.imagePrompt : generatedData.imagePrompt2;
        if (!prompt) {
            setError(`No hay prompt para la imagen ${imageNumber}.`);
            return;
        }

        const setLoading = imageNumber === 1 ? setIsImage1Loading : setIsImage2Loading;
        const setUrl = imageNumber === 1 ? setImageUrl : setImageUrl2;
        
        setLoading(true);
        setError(null);
        setSaveSuccess(null);
        setSaveError(null);
        
        try {
            const result = await generateProductImage(prompt, userApiKey, imageStyle, aspectRatio);
            const compressedUrl = await compressImage(result);
            setUrl(compressedUrl);
        } catch (e: any) {
            console.error(`Error regenerating image ${imageNumber}:`, e);
            setError(`Error al regenerar imagen ${imageNumber}: ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, [generatedData, userApiKey, imageStyle, aspectRatio]);

    const handleDeleteImage = useCallback((imageNumber: 1 | 2) => {
        if (imageNumber === 1) {
            setImageUrl('');
        } else {
            setImageUrl2('');
        }
    }, []);

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
            purchasePrice: purchasePrice,
            unit: unit,
            currency: generatedData.currency,
            imageUrl1: imageUrl,
            imageUrl2: imageUrl2,
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                    errorMessage = errorJson.error || `Respuesta inesperada: ${responseText}`;
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
                errorMessage = "Error de red o CORS. Asegúrese de que el servidor esté configurado correctamente.";
            } else if (e.message) {
                errorMessage = e.message;
            }
            setSaveError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    }, [generatedData, imageUrl, imageUrl2, categoryId, stockQuantity, purchasePrice, unit, apiUrl]);

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
        setIsGeneratingDetails(false);
        setIsImage1Loading(false);
        setIsImage2Loading(false);
        setShowApiGuide(false);
        setPurchasePrice(0);
        setUnit('UNI');
    }, []);
    
    const isAnythingLoading = isGeneratingDetails || isImage1Loading || isImage2Loading;

    return (
        <>
            <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={handleSaveSettings}
                onShowApiGuide={() => {
                    setIsSettingsOpen(false);
                    setShowApiGuide(true);
                }}
                 onShowCategoriesApiGuide={() => {
                    setIsSettingsOpen(false);
                    setShowCategoriesApiGuide(true);
                }}
                initialApiKey={userApiKey}
                initialApiUrl={apiUrl}
                initialCategoriesApiUrl={categoriesApiUrl}
            />
            {showApiGuide && <ApiGuide onClose={() => setShowApiGuide(false)} />}
            {showCategoriesApiGuide && <CategoriesApiGuide onClose={() => setShowCategoriesApiGuide(false)} />}
            
            {!apiKeyReady ? (
                <ApiKeySelectionScreen 
                    onSelectKey={handleSelectKey} 
                    onOpenSettings={handleOpenSettings}
                    error={error}
                    onDismissError={() => setError(null)}
                />
            ) : (
                <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
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
                                isLoading={isAnythingLoading}
                                error={error}
                                successMessage={successMessage}
                                language={language}
                                setLanguage={setLanguage}
                                categoryId={categoryId}
                                setCategoryId={setCategoryId}
                                stockQuantity={stockQuantity}
                                setStockQuantity={setStockQuantity}
                                purchasePrice={purchasePrice}
                                setPurchasePrice={setPurchasePrice}
                                unit={unit}
                                setUnit={setUnit}
                                tone={tone}
                                setTone={setTone}
                                temperature={temperature}
                                setTemperature={setTemperature}
                                imageStyle={imageStyle}
                                setImageStyle={setImageStyle}
                                aspectRatio={aspectRatio}
                                setAspectRatio={setAspectRatio}
                                categories={categories}
                                isCategoriesLoading={isCategoriesLoading}
                                categoriesError={categoriesError}
                            />

                            {isGeneratingDetails && <Loader />}

                            {!isGeneratingDetails && !generatedData && !error && (
                                <div className="text-center text-gray-500 py-10">
                                    <p>Ingrese el nombre de un producto para comenzar.</p>
                                </div>
                            )}

                            {generatedData && (
                                <ProductCard
                                    data={generatedData}
                                    onDataChange={handleDataChange}
                                    purchasePrice={purchasePrice}
                                    onPurchasePriceChange={setPurchasePrice}
                                    imageUrl={imageUrl}
                                    imageUrl2={imageUrl2}
                                    isImage1Loading={isImage1Loading}
                                    isImage2Loading={isImage2Loading}
                                    onRegenerateImage={handleRegenerateImage}
                                    onDeleteImage={handleDeleteImage}
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
            )}
        </>
    );
};