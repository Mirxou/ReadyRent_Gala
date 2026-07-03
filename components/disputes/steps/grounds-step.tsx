'use client';

import * as React from 'react';
import { useDisputeStore } from '@/lib/hooks/use-dispute-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { GraduationCap, ShieldAlert } from 'lucide-react';

export function GroundsStep() {
  const { formData, setFormData } = useDisputeStore();

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-blue-900">توضيح أسباب النزاع</h3>
        <p className="text-gray-500 font-medium">قدم تفاصيل دقيقة لمساعدة القضاة في فهم قضيتك.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <Label htmlFor="subject" className="text-sm font-black text-gray-700">موضوع النزاع باختصار</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ subject: e.target.value })}
            placeholder="مثال: تلف الشاشة عند الاستلام"
            className="rounded-2xl h-14 border-gray-200 focus:ring-blue-600 focus:border-blue-600 transition-all font-medium"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-sm font-black text-gray-700">تفاصيل الواقعة</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ description: e.target.value })}
            placeholder="اشرح بالتفصيل ما حدث، متى، وأين..."
            className="rounded-3xl border-gray-200 focus:ring-blue-600 focus:border-blue-600 transition-all min-h-[150px] font-medium"
          />
        </div>

        {/* Admissibility Checklist (Judicial Consistency) */}
        <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 space-y-4">
          <div className="flex items-center gap-3 text-blue-900 font-black">
            <GraduationCap className="w-5 h-5 text-gold-500" />
            <span>معايير القبول القضائي</span>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3 space-x-reverse">
              <Checkbox 
                id="admissible" 
                checked={formData.isAdmissible}
                onCheckedChange={(checked) => setFormData({ isAdmissible: !!checked })}
                className="mt-1 border-blue-600 data-[state=checked]:bg-blue-600"
              />
              <Label htmlFor="admissible" className="text-xs text-blue-800 font-medium leading-relaxed cursor-pointer select-none">
                أقر بأن المعلومات المقدمة دقيقة وحقيقية، وبأنني لم أحاول حل النزاع ودياً مع الطرف الآخر لمدة 24 ساعة على الأقل دون فائدة.
              </Label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-100">
           <ShieldAlert className="w-6 h-6 text-amber-500 flex-shrink-0" />
           <p className="text-[10px] text-amber-800 font-medium">
             تذكر: التصريحات الكاذبة في النظام القضائي قد تؤدي إلى تجميد المحفظة وغرامات "عدم الاحترام".
           </p>
        </div>
      </div>
    </div>
  );
}
