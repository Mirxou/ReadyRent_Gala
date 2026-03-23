import { sovereignClient } from './sovereign-client';

export const chatbotApi = {
  createSession: (data?: { language?: string }) => 
    sovereignClient.post<any>('/chatbot/sessions/create_anonymous/', data || {}),
  sendMessage: (sessionId: number, message: string) => 
    sovereignClient.post<any>(`/chatbot/sessions/${sessionId}/send_message/`, { message }),
  quickChat: (message: string, language?: string) => 
    sovereignClient.post<any>('/chatbot/quick-chat/', { message, language: language || 'ar' }),
};

export const innovationApi = { // Unified Artisans + Bundles + Local Guide
  getArtisans: (params?: any) => sovereignClient.get<any[]>('/artisans/artisans/', { params }),
  getBundles: (params?: any) => sovereignClient.get<any[]>('/bundles/bundles/', { params }),
  getLocalGuideCategories: () => sovereignClient.get<any[]>('/local-guide/categories/'),
};
