
import { GoogleGenAI, Type } from "@google/genai";
import type { ProductData } from '../types';

/**
 * Creates a new GoogleGenAI instance.
 * This function is called before each API request to ensure the most up-to-date
 * API key from the environment is used, especially after the user selects a new key.
 * @returns A GoogleGenAI client instance.
 */
const getAiClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            description: "Un prompt en inglés, conciso y efectivo para un modelo de generación de imágenes, para crear una foto de estudio profesional y de alta calidad del producto sobre un fondo neutro."
        },
        imagePrompt2: {
            type: Type.STRING,
            description: "Un segundo prompt en inglés, conciso y efectivo para generar otra imagen del mismo producto desde un ángulo diferente (ej. 'side view', 'back view', 'close-up on details')."
        }
    },
    required: ["productName", "description", "metaDescription", "tags", "price", "currency", "imagePrompt", "imagePrompt2"]
};

export const generateProductDetails = async (productName: string, language: 'es' | 'en'): Promise<ProductData> => {
    try {
        const ai = getAiClient();

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

        const config = languageConfig[language];

        const prompt = `Para el producto "${productName}", genera los detalles completos. La descripción debe ser un bloque de HTML. Adicionalmente, genera una meta descripción para SEO, tags relevantes y un precio estimado en ${config.currency}. ${config.marketContext}. La respuesta debe estar completamente en ${config.langName}, excepto los campos 'imagePrompt' que siempre deben estar en inglés. Responde únicamente en formato JSON, siguiendo el esquema proporcionado. El código de moneda en el JSON final debe ser '${config.currencyCode}'.`;
        
        const localProductSchema = JSON.parse(JSON.stringify(productSchema));
        localProductSchema.properties.price.description = `Un precio estimado y realista del producto en el mercado objetivo. Solo el número, sin comas ni símbolos. La moneda debe ser ${config.currencyCode}.`;
        localProductSchema.properties.currency.description = `La moneda para el precio, que debe ser '${config.currencyCode}'.`;


        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: localProductSchema,
                temperature: 0.8,
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

export const generateProductImage = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
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
