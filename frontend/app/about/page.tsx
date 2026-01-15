'use client';

import { motion } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { Sparkles, Heart, Zap, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
    {
        icon: <Sparkles className="w-8 h-8 text-gala-gold" />,
        title: "مجموعة استثنائية",
        description: "نختار كل قطعة بعناية فائقة لتناسب أرقـى المناسبات والاحتفالات ."
    },
    {
        icon: <Heart className="w-8 h-8 text-gala-pink" />,
        title: "صُنع الشغف",
        description: "قصتنا بدأت من الرغبة في جعل كل امرأة تشعر وكأنها ملكة في ليلتها."
    },
    {
        icon: <Zap className="w-8 h-8 text-gala-purple" />,
        title: "خدمة سريعة",
        description: "التوصيل والتجهيز في وقت قياسي لضمان راحتكم التامة."
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-gala-cyan" />,
        title: "جودة مضمونة",
        description: "نضمن نظافة وسلامة كل فستان بأعلى معايير العناية المهنية."
    }
];

export default function AboutPage() {
    return (
        <div className="relative min-h-screen pt-32 pb-24 overflow-hidden">
            {/* Background immersion */}
            <div className="fixed inset-0 -z-10">
                <ParticleField />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Hero Section */}
                <div className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-mega mb-6 inline-block">قصة غالا.</h1>
                        <p className="text-2xl md:text-3xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                            نحن لا نؤجر الفساتين فحسب، بل نصنع لحظات لا تُنسى من التألق والفخامة.
                        </p>
                    </motion.div>
                </div>

                {/* Narrative Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            رؤيتنا لعام 2026 وما بعده
                        </h2>
                        <p className="text-xl text-muted-foreground leading-loose">
                            تأسست <b>ReadyRent Gala</b> لتكون الوجهة الأولى لكل امرأة تبحث عن التفرد. نحن نؤمن أن الجمال يجب أن يكون متاحاً للجميع، مع الحفاظ على روح الفخامة والاستدامة التي تقتضيها الموضة الحديثة.
                        </p>
                        <p className="text-xl text-muted-foreground leading-loose">
                            في قلب قسنطينة والجزائر، نجحنا في بناء مجتمع من المتألقات اللواتي يثقن في ذوقنا واختياراتنا. كل فستان في مجموعتنا يحمل قصة، ونحن ننتظر أن تكوني أنتِ بطلة القصة القادمة.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl glow-purple"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-gala-purple/20 to-gala-pink/20 mix-blend-overlay" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-9xl font-black text-white/10 italic select-none">GALA</div>
                        </div>
                        {/* Overlay for glass effect */}
                        <div className="absolute inset-0 card-glass flex flex-col items-center justify-center p-12 text-center">
                            <Sparkles className="w-16 h-16 text-gala-gold mb-6 animate-pulse-glow" />
                            <h3 className="text-3xl font-bold mb-4">أناقة بلا حدود</h3>
                            <p className="text-lg text-muted-foreground">تجربة استثنائية تبدأ من اختيارك وتنتهي بلحظة دخولك للحفل.</p>
                        </div>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="card-glass p-8 group hover:scale-105 transition-all duration-500 cursor-default"
                        >
                            <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 group-hover:text-gala-purple transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Call to action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 p-12 rounded-[3rem] bg-gradient-to-r from-gala-purple/20 via-gala-pink/20 to-gala-gold/20 border border-white/10 text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-8">هل أنتِ مستعدة للتألق؟</h2>
                    <Link href="/products">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-block px-12 py-6 bg-gradient-to-r from-gala-purple to-gala-pink rounded-full text-2xl font-bold shadow-2xl glow-pink cursor-pointer"
                        >
                            تصفحي المجموعة الآن
                        </motion.div>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
