'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisputeForm } from '@/components/disputes/dispute-form';
import { DisputeCard } from '@/components/disputes/dispute-card';
import { disputesApi } from '@/lib/api';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ParticleField } from '@/components/ui/particle-field';
import { motion } from 'framer-motion';

interface Dispute {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'under_review' | 'in_mediation' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  booking?: { id: number; product: { name_ar: string } };
  message_count: number;
  created_at: string;
}

export default function DisputesPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: disputes, isLoading, refetch } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => disputesApi.getDisputes().then((res) => res.data),
  });

  const disputesList = disputes?.results || disputes || [];

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

          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <DisputeForm
                onSuccess={() => {
                  setShowForm(false);
                  refetch();
                }}
              />
            </motion.div>
          )}

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


