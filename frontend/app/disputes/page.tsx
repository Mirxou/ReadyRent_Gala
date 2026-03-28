'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisputeForm } from '@/components/disputes/dispute-form';
import { DisputeCard } from '@/components/disputes/dispute-card';
import { disputesApi } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function DisputesPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => disputesApi.getDisputes().then((res) => res.data),
  });

  const createDisputeMutation = useMutation({
    mutationFn: (newDispute: any) => disputesApi.createDispute(newDispute),
    onMutate: async (newDispute) => {
      await queryClient.cancelQueries({ queryKey: ['disputes'] });
      const previousDisputes = queryClient.getQueryData(['disputes']);

      // Construct a temporary optimistic dispute
      const optimisticDispute = {
        id: Date.now(),
        title: newDispute.subject,
        description: newDispute.description,
        status: 'open',
        priority: 'medium',
        message_count: 0,
        created_at: new Date().toISOString(),
        is_optimistic: true,
      };

      if (previousDisputes) {
        queryClient.setQueryData(['disputes'], (old: any) => {
          const results = Array.isArray(old) ? old : (old?.results || []);
          return {
            ...old,
            results: [optimisticDispute, ...results],
          };
        });
      }

      return { previousDisputes };
    },
    onError: (err, newDispute, context) => {
      if (context?.previousDisputes) {
        queryClient.setQueryData(['disputes'], context.previousDisputes);
      }
      toast.error('حدث خطأ أثناء إنشاء النزاع');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
    onSuccess: () => {
      setShowForm(false);
      toast.success('تم إنشاء النزاع بنجاح');
    },
  });

  const disputesList = useMemo(() => {
    return disputes?.results || disputes || [];
  }, [disputes]);

  return (
    <div className="relative min-h-screen">
      <ParticleField />
      
      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-gala-purple via-gala-pink to-gala-gold bg-clip-text text-transparent">
                النزاعات والدعم
              </h1>
              <p className="text-muted-foreground">إدارة النزاعات وطلبات الدعم</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'إلغاء' : 'إنشاء نزاع جديد'}
            </Button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <DisputeForm
                  isSubmitting={createDisputeMutation.isPending}
                  onSubmit={(data) => createDisputeMutation.mutate(data)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري تحميل النزاعات...</p>
            </div>
          ) : disputesList.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {disputesList.map((dispute: any, index: number) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DisputeCard dispute={dispute} />
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد نزاعات</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}


