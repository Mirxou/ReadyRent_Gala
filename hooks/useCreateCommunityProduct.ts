import { useState } from 'react';
import { api } from '@/lib/api'; // Corrected to named export

// Define input structure based on required fields for a product
export interface ProductInput {
    name: string;
    product_type: string;
    category: number; // ID of the category
    price_per_day: number;
    description: string;
    size: string;
    color: string;
    color_hex?: string;
    wilaya?: number;
    commune?: string;
    location_lat?: number | null;
    location_lng?: number | null;
    delivery_policy?: string;
    images?: any[]; // Allow handling images separately if needed, though usually handled via FormData
    [key: string]: any;
}

// The Hook
export const useCreateCommunityProduct = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Main function: Create Product
    const mutate = async (data: ProductInput) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Call the secured endpoint
            // Note: If sending images, we might need to use FormData. 
            // For now, assuming JSON as per prompt, but 'api' client handles params serialization.
            // If the backend expects multipart/form-data for images, we would need to convert 'data' to FormData here.
            // But let's stick to the prompt's simplicity first.

            const response = await api.post('/products/community/create/', data);

            // 2. Handle Success
            console.log('Product Created:', response.data);
            return response.data;

        } catch (err: any) {
            // 3. Handle Specialized Errors
            console.error('Create Product Error:', err);

            // Error 403: Trust Gateway Rejection (Low Risk Score)
            if (err.response?.status === 403) {
                const detail = err.response?.data?.detail;
                setError(typeof detail === 'string' ? detail : "نظام الثقة رفض طلبك. درجة المخاطرة لديك عالية.");
                return null;
            }

            // Error 401: Unauthorized
            if (err.response?.status === 401) {
                setError("يجب تسجيل الدخول لإضافة منتجات.");
                return null;
            }

            // Error 400: Validation Error
            if (err.response?.status === 400) {
                // If backend returns field errors
                const data = err.response?.data;
                const firstError = Object.values(data)[0];
                const msg = Array.isArray(firstError) ? firstError[0] : "يرجى التحقق من البيانات المدخلة.";
                setError(typeof firstError === 'string' ? firstError : msg);
                return null;
            }

            // General Errors
            setError("حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    return { mutate, isLoading, error };
};
