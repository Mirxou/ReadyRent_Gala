'use client';
import React, { useState } from 'react';
import { useCreateCommunityProduct } from '@/hooks/useCreateCommunityProduct';
import { WILAYAS } from '@/lib/dz-data';
import { MapPin, Truck } from 'lucide-react';

export const CommunityProductForm = () => {
    // 1. Connect to the Hook
    const { mutate, isLoading, error } = useCreateCommunityProduct();

    // 2. Form State
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        category: 1,
        size: 'M',
        color: 'Red',
        product_type: 'p2p',
        // Geo Fields
        wilaya: 16, // Default Algiers
        commune: '',
        delivery_policy: '',
        location_lat: null as number | null,
        location_lng: null as number | null,
    });

    const [isLocating, setIsLocating] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGPS = () => {
        if (!navigator.geolocation) {
            alert('الجي بي اس غير مدعوم في هذا المتصفح');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    location_lat: position.coords.latitude,
                    location_lng: position.coords.longitude
                }));
                setIsLocating(false);
            },
            () => {
                alert('فشل تحديد الموقع. تأكد من تفعيل GPS.');
                setIsLocating(false);
            }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({
            name: formData.name,
            price_per_day: Number(formData.price),
            description: formData.description,
            category: Number(formData.category),
            size: formData.size,
            color: formData.color,
            product_type: formData.product_type,
            // Geo Payload
            wilaya: Number(formData.wilaya),
            commune: formData.commune,
            delivery_policy: formData.delivery_policy,
            location_lat: formData.location_lat,
            location_lng: formData.location_lng
        });
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-[#2c3e50] mb-8 font-['IBM_Plex_Sans_Arabic'] flex items-center gap-2">
                <span>👗</span> ضع فستانك في خزنة المجتمع
            </h2>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                    ⚠️ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- Section 1: Basic Info --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all"
                            placeholder="مثال: قفطان قسنطينية ملكي"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">السعر (DA/يوم)</label>
                        <input
                            type="number"
                            name="price"
                            required
                            value={formData.price}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#d4af37]"
                            placeholder="5000"
                        />
                    </div>
                </div>

                {/* --- Section 2: Location & Delivery (New) --- */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#d4af37]" /> الموقع والتوصيل
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">الولاية</label>
                            <select
                                name="wilaya"
                                value={formData.wilaya}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                            >
                                {WILAYAS.map(w => (
                                    <option key={w.id} value={w.id}>{w.id} - {w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">البلدية</label>
                            <input
                                type="text"
                                name="commune"
                                value={formData.commune}
                                onChange={handleChange}
                                placeholder="مثال: الخروب"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600">
                            {formData.location_lat
                                ? `✅ تم تحديد الموقع: ${formData.location_lat.toFixed(4)}, ${formData.location_lng?.toFixed(4)}`
                                : "لم يتم تحديد الموقع GPS"}
                        </span>
                        <button
                            type="button"
                            onClick={handleGPS}
                            disabled={isLocating}
                            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                        >
                            {isLocating ? 'جاري التحديد...' : '📍 تحديد تلقائي'}
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1"><Truck className="w-3 h-3 inline" /> سياسة التوصيل</label>
                        <textarea
                            name="delivery_policy"
                            value={formData.delivery_policy}
                            onChange={handleChange}
                            rows={2}
                            placeholder="مثال: يد بيد في وسط المدينة، أو التوصيل عبر ياليدين بـ 500 دج"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                    <textarea
                        name="description"
                        required
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#d4af37]"
                        placeholder="اوصف الفستان، حالته، مقاساته..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold shadow-lg transform transition-all active:scale-95 ${isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#2c3e50] to-[#34495e] hover:shadow-xl'
                        }`}
                >
                    {isLoading ? 'جاري المعالجة...' : '✨ إضافة للخزنة'}
                </button>

            </form>
        </div>
    );
};
