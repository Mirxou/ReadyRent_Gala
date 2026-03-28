'use client';

import * as React from 'react';
import { useDisputeStore } from '@/lib/hooks/use-dispute-store';
import { disputesApi } from '@/lib/api/disputes';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image as ImageIcon, Video, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


export function EvidenceStep({ disputeId }: { disputeId?: number }) {
  const { formData, setFormData } = useDisputeStore();
  const [isUploading, setIsUploading] = React.useState(false);


  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Attempt real upload to backend; fall back to local preview if no disputeId
      let uploadedUrl = URL.createObjectURL(file); // local preview default
      let uploadedId = `ev-${Math.random().toString(36).substr(2, 9)}`;

      if (disputeId) {
        const result = await disputesApi.uploadEvidence(disputeId, file);
        uploadedUrl = result?.url ?? uploadedUrl;
        uploadedId = String(result?.id ?? uploadedId);
      }

      const evidence = {
        id: uploadedId,
        url: uploadedUrl,
        type: file.type.startsWith('video/') ? 'video' : 'image',
        name: file.name,
      };
      setFormData({ evidence: [...formData.evidence, evidence] });
      toast.success(`تم رفع ${file.name} بنجاح.`);
    } catch (err: any) {
      console.error('Evidence upload failed:', err);
      toast.error(err?.message ?? 'فشل رفع الدليل. تحقق من اتصالك.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };


  const removeEvidence = (id: string) => {
    setFormData({ evidence: formData.evidence.filter(ev => ev.id !== id) });
  };

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-blue-900">خزنة الأدلة الرقمية</h3>
        <p className="text-gray-500 font-medium">ارفع الصور أو المقاطع المرئية التي تدعم ادعاءك بشكل قاطع.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Dropzone Area */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/mp4" 
          onChange={handleFileChange} 
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "h-48 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-400 border-gray-200",
            isUploading && "animate-pulse pointer-events-none"
          )}
        >
          <div className="p-4 rounded-full bg-white shadow-xl shadow-gray-100 text-blue-600">
            <Upload className="w-8 h-8" />
          </div>
          <div className="text-center">
            <span className="text-sm font-black text-blue-900 block">اضغط للرفع أو اسحب الملف هنا</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 block">Max 10MB per file • JPG, PNG, MP4</span>
          </div>
        </div>

        {/* Evidence Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formData.evidence.map((ev) => (
            <div key={ev.id} className="group relative h-32 rounded-3xl bg-white border border-gray-100 overflow-hidden shadow-sm">
               <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  {ev.type === 'image' ? <ImageIcon className="w-8 h-8 text-gray-400" /> : <Video className="w-8 h-8 text-gray-400" />}
               </div>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="w-8 h-8 rounded-full shadow-lg"
                    onClick={(e) => { e.stopPropagation(); removeEvidence(ev.id); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
               </div>
               <div className="absolute bottom-0 inset-x-0 p-2 bg-white/80 backdrop-blur-sm">
                  <span className="text-[10px] font-bold text-gray-500 truncate block">{ev.id}</span>
               </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 p-5 rounded-3xl bg-success-50 border border-success-100">
           <ShieldCheck className="w-6 h-6 text-success-600 flex-shrink-0" />
           <p className="text-xs text-success-800 font-medium">
             سيتم تشفير كافة الملفات المرفوعة وربطها بهاش العقد (Contract Hash) لضمان عدم التلاعب.
           </p>
        </div>
      </div>
    </div>
  );
}
