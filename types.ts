

export interface ProductData {
    productName: string;
    description: string; // Contendrá el HTML formateado
    metaDescription: string;
    tags: string[];
    price: number;
    currency: string;
    imagePrompt: string;
    imagePrompt2: string;
}

export interface ApiResponse {
    categoryId: number;
    stockQuantity: number;
    productName: string;
    description: string; // Contendrá el HTML formateado
    metaDescription: string;
    tags: string[];
    price: number;
    purchasePrice: number;
    unit: string;
    currency: string;
    imageUrl1: string;
    imageUrl2: string;
}

export interface Category {
  id: number;
  parentId: number;
  level: number;
  name: string;
}