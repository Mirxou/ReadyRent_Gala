'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">تم إلغاء الدفع</h1>
        <p className="text-muted-foreground text-sm mb-6">
          لم يتم خصم أي مبلغ من حسابك. يمكنك إعادة المحاولة في أي وقت.
        </p>
        <div className="space-y-3">
          <Button variant="default" className="w-full" onClick={() => router.push('/dashboard')}>
            لوحة التحكم
          </Button>
          <Button variant="ghost" className="w-full gap-2" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4" />
            الرئيسية
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
