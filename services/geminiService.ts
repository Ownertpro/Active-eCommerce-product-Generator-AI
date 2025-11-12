
import { GoogleGenAI, Type } from "@google/genai";
import type { ProductData } from '../types';

/**
 * Creates a new GoogleGenAI instance.
 * It uses the provided API key, or falls back to the one in the environment.
 * This allows for both user-provided keys and keys from the AI Studio environment.
 * @param apiKey An optional API key string.
 * @returns A GoogleGenAI client instance.
 */
const getAiClient = (apiKey?: string | null) => {
    const key = apiKey || process.env.API_KEY;
    if (!key) {
        throw new Error("API key not found. Please provide an API key in the settings or select one via Google AI Studio.");
    }
    return new GoogleGenAI({ apiKey: key });
};

/**
 * Valida una clave de API de Gemini realizando una llamada de prueba simple.
 * @param apiKey La clave de API a validar.
 * @returns Una promesa que se resuelve a `true` si la clave es válida, `false` en caso contrario.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) {
        return false;
    }
    try {
        const ai = getAiClient(apiKey);
        // Utiliza un modelo rápido y una pregunta simple para una validación de bajo costo.
        await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "test",
        });
        return true; // Si no hay error, la clave es válida.
    } catch (error) {
        console.warn("La validación de la clave de API falló:", error);
        // Cualquier error en esta etapa (permisos, clave inválida, etc.) significa que la clave no es utilizable.
        return false;
    }
};


const productSchema = {
    type: Type.OBJECT,
    properties: {
        productName: {
            type: Type.STRING,
            description: "El nombre oficial y completo del producto."
        },
        description: {
            type: Type.STRING,
            description: `Una descripción completa y detallada del producto en formato HTML, lista para ser insertada en una página web. Debe seguir estrictamente esta estructura:
1. Un <h3> con un título destacado del producto.
2. Un <p> con un párrafo introductorio de marketing.
3. Un <h4> con el texto "✅ Principales características" (o "✅ Key Features" si es en inglés).
4. Un <ul> con 5 a 7 <li> que listen las características o beneficios clave.
5. Opcionalmente, más secciones con <h4> y <ul> para "¿Para quién es ideal?", "Detalles adicionales" o "Consideraciones".
6. Un <hr> opcional antes del resumen final.
7. Un <p> final con un párrafo de resumen convincente.`
        },
        metaDescription: {
            type: Type.STRING,
            description: "Una meta descripción corta para SEO, de máximo 160 caracteres, que resuma el producto y motive al clic."
        },
        tags: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            },
            description: "Una lista de 5 a 7 tags o palabras clave relevantes para el producto (ej: 'smartphone', 'cámara pro', 'tecnología paraguay')."
        },
        price: {
            type: Type.NUMBER,
            description: "Un precio estimado y realista del producto en el mercado. Solo el número, sin comas ni símbolos."
        },
        currency: {
            type: Type.STRING,
            description: "La moneda para el precio, que debe ser 'PYG' o 'USD'."
        },
        imagePrompt: {
            type: Type.STRING,
            description: "Un prompt en inglés, conciso y efectivo para un modelo de generación de imágenes, para crear una foto de producto atractiva y de alta calidad."
        },
        imagePrompt2: {
            type: Type.STRING,
            description: "Un segundo prompt en inglés, conciso y efectivo para generar otra imagen del mismo producto desde un ángulo diferente (ej. 'side view', 'back view', 'close-up on details')."
        }
    },
    required: ["productName", "description", "metaDescription", "tags", "price", "currency", "imagePrompt", "imagePrompt2"]
};

export const generateProductDetails = async (
    productName: string, 
    language: 'es' | 'en', 
    apiKey?: string | null,
    tone: string = 'persuasive',
    temperature: number = 0.8
): Promise<ProductData> => {
    try {
        const ai = getAiClient(apiKey);

        const languageConfig = {
            es: {
                langName: "español",
                marketContext: "El contexto es el mercado de Paraguay.",
                currency: "Guaraníes Paraguayos (PYG)",
                currencyCode: "PYG",
            },
            en: {
                langName: "inglés",
                marketContext: "The context is the international e-commerce market.",
                currency: "US Dollars (USD)",
                currencyCode: "USD",
            }
        };

        const toneConfig = {
            es: {
                persuasive: "un tono de marketing persuasivo y vendedor",
                professional: "un tono profesional, informativo y formal",
                friendly: "un tono cercano, amigable y conversacional",
                technical: "un tono técnico, centrado en especificaciones y datos precisos"
            },
            en: {
                persuasive: "a persuasive and sales-oriented marketing tone",
                professional: "a professional, informative, and formal tone",
                friendly: "a close, friendly, and conversational tone",
                technical: "a technical tone, focused on specifications and precise data"
            }
        };

        const config = languageConfig[language];
        const toneDescription = toneConfig[language][tone as keyof typeof toneConfig.es] || toneConfig.es.persuasive;

        const prompt = `Para el producto "${productName}", genera los detalles completos. La descripción debe ser un bloque de HTML con ${toneDescription}. Adicionalmente, genera una meta descripción para SEO, tags relevantes y un precio estimado en ${config.currency}. ${config.marketContext}. La respuesta debe estar completamente en ${config.langName}, excepto los campos 'imagePrompt' que siempre deben estar en inglés. Responde únicamente en formato JSON, siguiendo el esquema proporcionado. El código de moneda en el JSON final debe ser '${config.currencyCode}'.`;
        
        const localProductSchema = JSON.parse(JSON.stringify(productSchema));
        localProductSchema.properties.price.description = `Un precio estimado y realista del producto en el mercado objetivo. Solo el número, sin comas ni símbolos. La moneda debe ser ${config.currencyCode}.`;
        localProductSchema.properties.currency.description = `La moneda para el precio, que debe ser '${config.currencyCode}'.`;


        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: localProductSchema,
                temperature: temperature,
            },
        });

        const jsonString = response.text.trim();
        const parsedData: ProductData = JSON.parse(jsonString);
        return parsedData;
    } catch (error: any) {
        console.error("Error generating product details:", error);
        if (error.toString().includes('RESOURCE_EXHAUSTED') || error.toString().includes('429')) {
             throw new Error(`Error de cuota de API (429): Has excedido tu cuota de uso. Por favor, revisa tu plan y facturación en Google AI Studio.`);
        }
        // Re-throw to be handled by the UI
        throw error;
    }
};

export const generateProductImage = async (
    prompt: string, 
    apiKey?: string | null,
    imageStyle: string = 'studio',
    aspectRatio: '1:1' | '4:3' | '16:9' = '1:1'
): Promise<string> => {
    try {
        const ai = getAiClient(apiKey);

        const stylePrompts: { [key: string]: string } = {
            studio: 'professional studio photography, clean neutral background, high detail, 8k',
            lifestyle: 'lifestyle shot, in a relevant real-world setting, natural lighting, high quality',
            minimalist: 'minimalist style, simple composition, plain background, focus on product shape',
            closeup: 'macro shot, close-up on product details and texture, dramatic lighting'
        };

        const styleDescription = stylePrompts[imageStyle] || stylePrompts.studio;
        const finalPrompt = `${prompt}, ${styleDescription}`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error: any) {
        console.error("Error generating product image:", error);
        if (error.toString().includes('RESOURCE_EXHAUSTED') || error.toString().includes('429')) {
             throw new Error(`Error de cuota de API (429): Has excedido tu cuota de uso. Por favor, revisa tu plan y facturación en Google AI Studio.`);
        }
        // Re-throw to be handled by the UI
        throw error;
    }
};