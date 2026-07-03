"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

interface InteractiveProductCardProps {
    product: {
        id: number;
        name_ar: string;
        slug?: string;
        price_per_day: number;
        category?: {
            name_ar: string;
        };
        images?: Array<{
            image: string;
            is_primary: boolean;
        }>;
        primary_image?: string;
        is_featured?: boolean;
    };
    className?: string;
    priority?: boolean;
}

export const InteractiveProductCard = ({
    product,
    className,
    priority = false,
}: InteractiveProductCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();

    const primaryImage = product.primary_image ||
        product.images?.find((img) => img.is_primary)?.image ||
        product.images?.[0]?.image ||
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop';

    const id = product.id;
    const name = product.name_ar;
    const price = product.price_per_day;
    const category = product.category?.name_ar;
    const isNew = product.is_featured;
    const slug = product.slug || id;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Confetti explosion
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        confetti({
            particleCount: 30,
            spread: 60,
            origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight
            },
            colors: ['#8B5CF6', '#EC4899', '#F59E0B']
        });
    };

    return (
        <Link href={`/products/${slug}`}>
            <motion.div
                className={cn(
                    "group relative rounded-2xl overflow-hidden transition-all duration-500",
                    "border-2 border-transparent hover:border-gradient",
                    "card-glass hover:glow-purple",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />

                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-animated opacity-0 group-hover:opacity-10 transition-opacity duration-500 z-10 pointer-events-none" />

                {/* Image Container */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-gala-purple/10 to-gala-pink/10">
                    {/* Badges */}
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                        {isNew && (
                            <Badge className="bg-gradient-to-r from-gala-gold to-gala-pink text-white border-0 animate-pulse-glow">
                                <Sparkles className="w-3 h-3 mr-1" />
                                جديد
                            </Badge>
                        )}
                        {category && (
                            <Badge className="bg-white/90 dark:bg-black/90 backdrop-blur text-foreground border-gray-200 dark:border-white/20">
                                {category}
                            </Badge>
                        )}
                    </div>

                    {/* Product Image */}
                    <motion.div
                        className="relative w-full h-full"
                        animate={{
                            scale: isHovered ? 1.1 : 1,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <Image
                            src={primaryImage}
                            alt={name}
                            fill
                            priority={priority}
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </motion.div>

                    {/* Hover Actions */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent dark:from-black/80 dark:via-black/40 from-gray-900/80 via-gray-900/40 flex items-end justify-center p-6 gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: isHovered ? 1 : 0,
                            y: isHovered ? 0 : 20,
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            onClick={handleAddToCart}
                            className="px-6 py-3 rounded-full bg-gradient-to-r from-gala-purple to-gala-pink text-white font-semibold flex items-center gap-2 hover:scale-110 transition-transform duration-300 glow-purple"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            أضف للسلة
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/products/${slug}`);
                            }}
                            className="p-3 rounded-full bg-white/20 dark:bg-white/20 backdrop-blur text-white hover:bg-white/30 dark:hover:bg-white/30 transition-colors duration-300"
                            aria-label="عرض التفاصيل"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>

                {/* Product Info */}
                <div className="p-6 space-y-3 relative z-10">
                    <h3 className="text-xl font-bold line-clamp-2 group-hover:text-gala-purple transition-colors duration-300">
                        {name}
                    </h3>

                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-2xl font-bold bg-gradient-to-r from-gala-purple to-gala-pink bg-clip-text text-transparent">
                                {price.toLocaleString('ar-DZ')} دج
                            </p>
                            <p className="text-sm text-muted-foreground">لليوم الواحد</p>
                        </div>

                        <motion.div
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-gala-purple/20 to-gala-pink/20 flex items-center justify-center"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Sparkles className="w-6 h-6 text-gala-gold" />
                        </motion.div>
                    </div>
                </div>

                {/* Rotating border effect */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold opacity-50 blur-xl" />
                </div>
            </motion.div>
        </Link>
    );
};
