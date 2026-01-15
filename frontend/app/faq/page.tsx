'use client';

import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ParticleField } from '@/components/ui/particle-field';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const { data: faqs, isLoading, isError } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => cmsApi.getFAQs().then((res) => res.data),
  });

  const toggleItem = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkHelpful = async (id: number) => {
    try {
      await cmsApi.markFAQHelpful(id);
      toast.success('شكراً لك!');
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const filteredFAQs = faqs?.results?.filter((faq: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        faq.question?.toLowerCase().includes(searchLower) ||
        faq.answer?.toLowerCase().includes(searchLower) ||
        faq.category?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || faqs?.results || [];

  const categories = Array.from(
    new Set(filteredFAQs.map((faq: any) => faq.category).filter(Boolean))
  ) as string[];

  return (
    <div className="relative min-h-screen">
      <ParticleField />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gala-purple/20 mb-6">
            <HelpCircle className="h-10 w-10 text-gala-purple" />
          </div>
          <div className="mb-6" style={{ overflow: 'visible', width: '100%' }}>
            <h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #EC4899, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
                lineHeight: '1.5',
                padding: '2rem 6rem 2rem 1rem',
                margin: '0 auto',
                width: 'auto',
                maxWidth: '100%',
                overflow: 'visible',
                whiteSpace: 'nowrap',
              }}
            >
              الأسئلة الشائعة
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ابحث عن إجابات لأسئلتك الشائعة حول خدماتنا
          </p>
        </motion.div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث في الأسئلة الشائعة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">جاري تحميل الأسئلة...</p>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل الأسئلة</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
            </CardContent>
          </Card>
        ) : filteredFAQs.length > 0 ? (
          <div className="space-y-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-gala-purple">{category}</h2>
                  <div className="space-y-4">
                    {filteredFAQs
                      .filter((faq: any) => faq.category === category)
                      .map((faq: any) => (
                        <Card key={faq.id} className="overflow-hidden">
                          <CardHeader
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleItem(faq.id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <CardTitle className="text-lg">{faq.question}</CardTitle>
                              {openItems.includes(faq.id) ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </CardHeader>
                          <AnimatePresence>
                            {openItems.includes(faq.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <CardContent>
                                  <p className="text-muted-foreground mb-4">{faq.answer}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkHelpful(faq.id);
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                    مفيد
                                    {faq.helpful_count > 0 && (
                                      <span className="text-xs">({faq.helpful_count})</span>
                                    )}
                                  </Button>
                                </CardContent>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      ))}
                  </div>
                </div>
              ))
            ) : (
              filteredFAQs.map((faq: any) => (
                <Card key={faq.id} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleItem(faq.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-lg">{faq.question}</CardTitle>
                      {openItems.includes(faq.id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {openItems.includes(faq.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CardContent>
                          <p className="text-muted-foreground mb-4">{faq.answer}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkHelpful(faq.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            مفيد
                            {faq.helpful_count > 0 && (
                              <span className="text-xs">({faq.helpful_count})</span>
                            )}
                          </Button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">لا توجد أسئلة متاحة</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

