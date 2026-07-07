'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Camera,
  CameraOff,
  RotateCcw,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Star,
  ArrowLeft,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ImageIcon,
  Eye,
  TrendingUp,
  Zap,
  Crown,
  Lock,
  RefreshCw,
  CircleCheck,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { useAuthStore } from '@/lib/store';
import { verificationApi } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

// ──── Types ────
type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'ai_approved'
  | 'community_review'
  | 'verified'
  | 'ai_rejected'
  | 'rejected'
  | 'loading';

interface VerificationData {
  status: VerificationStatus;
  ai_score?: number;
  ai_quality?: string;
  ai_issues?: string[];
  approval_count?: number;
  required_approvals?: number;
  approvals?: Array<{ id: string; voter_name: string; voted_at: string; comment?: string }>;
  rejection_reason?: string;
  face_photo_url?: string;
  submitted_at?: string;
}

interface PendingVerification {
  id: string;
  user_name: string;
  face_photo_url: string;
  ai_score: number;
  approval_count: number;
  required_approvals: number;
  submitted_at: string;
}

// Map API response to frontend shape
function mapPendingVerification(raw: Record<string, unknown>): PendingVerification {
  const user = raw.user as Record<string, string> | undefined;
  const name = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'مستخدم';
  return {
    id: raw.id as string,
    user_name: name,
    face_photo_url: raw.face_photo as string || '',
    ai_score: (raw.ai_score as number) || 0,
    approval_count: (raw.approval_count as number) || 0,
    required_approvals: (raw.required_approvals as number) || 5,
    submitted_at: raw.created_at as string || '',
  };
}

// ──── Animation Variants ────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
};

// ──── Benefits Data ────
const benefits = [
  {
    icon: TrendingUp,
    title: 'رفع نقاط الثقة',
    description: 'احصل على 15 نقطة إضافية عند اكتمال التحقق مما يعزز مصداقيتك',
  },
  {
    icon: Crown,
    title: 'وصول للمنتجات الحصرية',
    description: 'المنتجات الفاخرة والحصرية تتطلب توثيق الهوية للوصول إليها',
  },
  {
    icon: Zap,
    title: 'معاملات أسرع',
    description: 'حجوزاتك تُعالج تلقائياً بدون مراجعة يدوية إضافية',
  },
  {
    icon: Lock,
    title: 'حماية متقدمة',
    description: 'حسابك محمي بطبقة أمان إضافية وإشعارات فورية',
  },
  {
    icon: UserCheck,
    title: 'المراجعة المجتمعية',
    description: 'شارك في مراجعة طلبات التحقق بعد توثيق هويتك',
  },
  {
    icon: Star,
    title: 'شارة التوثيق',
    description: 'احصل على شارة "متحقق" مميزة في ملفك الشخصي',
  },
];

// ═══════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════
export default function VerificationPage() {
  // ──── State ────
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('loading');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Community review queue
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{ id: string; vote: 'approve' | 'reject' } | null>(null);
  const [voteComment, setVoteComment] = useState('');

  // Auth store
  const { isAuthenticated, is_verified } = useAuthStore();

  // ──── Camera Functions ────
  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError(true);
      toast.error('لا يمكن الوصول إلى الكاميرا. يمكنك رفع صورة بدلاً من ذلك.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ──── File Upload Fallback ────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الصورة يتجاوز 10 ميغابايت');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedPhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // ──── Fetch Verification Status ────
  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await verificationApi.getStatus();
      if (data) {
        setVerificationStatus(data.status || 'not_submitted');
        // Map API response to VerificationData shape
        const mapped: VerificationData = {
          status: data.status || 'not_submitted',
          ai_score: data.ai_score,
          ai_quality: data.ai_analysis?.face_quality,
          ai_issues: data.ai_analysis?.issues,
          approval_count: data.approval_count,
          required_approvals: data.required_approvals,
          rejection_reason: data.rejection_reason,
          face_photo_url: data.face_photo_url,
          submitted_at: data.created_at,
          approvals: Array.isArray(data.votes)
            ? data.votes
                .filter((v: Record<string, string>) => v.vote === 'approve')
                .map((v: Record<string, string>) => ({
                  id: v.voter_id,
                  voter_name: v.voter_first_name && v.voter_last_name
                    ? `${v.voter_first_name} ${v.voter_last_name}`
                    : v.voter_username || 'موثق',
                  voted_at: v.created_at,
                  comment: v.comment,
                }))
            : [],
        };
        setVerificationData(mapped);
      }
    } catch {
      setVerificationStatus('not_submitted');
    }
  }, []);

  // ──── Submit for AI Analysis ────
  const submitForAI = useCallback(async () => {
    if (!capturedPhoto) {
      toast.error('يرجى التقاط صورة أو رفع واحدة أولاً');
      return;
    }
    setIsAiAnalyzing(true);
    try {
      const { data } = await verificationApi.submit(capturedPhoto);
      if (data?.status === 'ai_approved' || data?.status === 'community_review') {
        toast.success('تم تحليل الصورة بنجاح! صورتك الآن قيد المراجعة المجتمعية.');
      } else if (data?.status === 'ai_rejected') {
        toast.error('لم يتم قبول الصورة. يرجى المحاولة مرة أخرى.');
      } else {
        toast.success('تم إرسال الصورة بنجاح');
      }
      setVerificationStatus(data?.status || 'pending');
      setCapturedPhoto(null);
      // Re-fetch status to get properly mapped data
      fetchStatus();
    } catch {
      toast.error('فشل إرسال الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [capturedPhoto, fetchStatus]);

  // Auto-refresh status for pending states
  useEffect(() => {
    if (!isAuthenticated) {
      setVerificationStatus('not_submitted');
      return;
    }
    fetchStatus();
  }, [isAuthenticated, fetchStatus]);

  useEffect(() => {
    const needsRefresh =
      verificationStatus === 'pending' ||
      verificationStatus === 'ai_approved' ||
      verificationStatus === 'community_review';
    if (!needsRefresh) return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [verificationStatus, fetchStatus]);

  // ──── Community Review Queue ────
  const fetchPendingQueue = useCallback(async () => {
    if (!is_verified) return;
    setLoadingQueue(true);
    try {
      const { data } = await verificationApi.getPending();
      const rawList = Array.isArray(data) ? data : data?.results || [];
      setPendingVerifications(rawList.map(mapPendingVerification));
    } catch {
      // silently fail - queue may not be available
    } finally {
      setLoadingQueue(false);
    }
  }, [is_verified]);

  useEffect(() => {
    if (is_verified) {
      fetchPendingQueue();
    }
  }, [is_verified, fetchPendingQueue]);

  const handleVote = useCallback(
    async (verificationId: string, vote: 'approve' | 'reject', comment?: string) => {
      setVotingId(verificationId);
      try {
        await verificationApi.vote(verificationId, vote, comment);
        toast.success(vote === 'approve' ? 'تمت الموافقة بنجاح' : 'تم الرفض');
        setCommentModal(null);
        setVoteComment('');
        fetchPendingQueue();
      } catch {
        toast.error('فشل تسجيل التصويت');
      } finally {
        setVotingId(null);
      }
    },
    [fetchPendingQueue],
  );

  // ──── Render Helpers ────
  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'verified':
        return {
          icon: ShieldCheck,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          label: 'تم التوثيق',
        };
      case 'ai_rejected':
      case 'rejected':
        return {
          icon: ShieldX,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
          label: 'مرفوض',
        };
      case 'pending':
      case 'ai_approved':
      case 'community_review':
        return {
          icon: Clock,
          color: 'text-amber-400',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          label: 'قيد المراجعة',
        };
      default:
        return {
          icon: Shield,
          color: 'text-sovereign-gold',
          bgColor: 'bg-sovereign-gold/10',
          borderColor: 'border-sovereign-gold/30',
          badgeColor: 'bg-sovereign-gold/10 text-sovereign-gold border-sovereign-gold/30',
          label: 'غير مُقدَّم',
        };
    }
  };

  const approvalCount = verificationData?.approval_count || 0;
  const requiredApprovals = verificationData?.required_approvals || 5;
  const approvalProgress = Math.min((approvalCount / requiredApprovals) * 100, 100);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Background Glow */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-sovereign-gold/3 rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* ──── Hero Section ──── */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="text-center mb-16"
        >
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30 rounded-full py-1 px-4 text-xs font-bold mb-6">
              <Shield className="w-4 h-4" />
              هويتك محمية وموثقة
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-6xl font-black mb-4"
          >
            توثيق <span className="text-sovereign-gold">الهوية</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            وثّق هويتك بالذكاء الاصطناعي والمراجعة المجتمعية لتتمتع بمزايا حصرية وزيادة نقاط ثقتك
          </motion.p>
        </motion.div>

        {/* ──── Verification Status Card ──── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <GlassPanel
            className="p-6 md:p-8 rounded-[2rem]"
            variant="obsidian"
            gradientBorder
          >
            {verificationStatus === 'loading' ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl ${getStatusConfig().bgColor} border ${getStatusConfig().borderColor} flex items-center justify-center`}
                    >
                      {(() => {
                        const Icon = getStatusConfig().icon;
                        return <Icon className={`w-7 h-7 ${getStatusConfig().color}`} />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">حالة التوثيق</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {verificationStatus === 'verified'
                          ? 'هويتك موثقة بالكامل'
                          : verificationStatus === 'ai_rejected' || verificationStatus === 'rejected'
                            ? 'تم رفض طلب التوثيق'
                            : verificationStatus === 'community_review' || verificationStatus === 'ai_approved'
                              ? `${formatNumber(approvalCount)} من ${formatNumber(requiredApprovals)} موافقات`
                              : verificationStatus === 'pending'
                                ? 'قيد التحليل بالذكاء الاصطناعي'
                                : 'لم يتم تقديم طلب بعد'}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${getStatusConfig().badgeColor} text-sm py-1 px-4`}>
                    {getStatusConfig().label}
                  </Badge>
                </div>

                {/* Progress Bar for community review */}
                {(verificationStatus === 'community_review' || verificationStatus === 'ai_approved') && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">التقدم في المراجعة المجتمعية</span>
                      <span className="text-sm font-bold text-sovereign-gold">
                        {formatNumber(approvalCount)} / {formatNumber(requiredApprovals)}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        key={approvalCount}
                        className="h-full rounded-full bg-gradient-to-l from-sovereign-gold to-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${approvalProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassPanel>
        </motion.div>

        {/* ──── Main Content Area ──── */}
        <AnimatePresence mode="wait">
          {/* Stage 1: Face Capture (not_submitted) */}
          {(verificationStatus === 'not_submitted' || capturedPhoto || cameraActive || isAiAnalyzing) &&
            verificationStatus !== 'verified' &&
            verificationStatus !== 'ai_rejected' &&
            verificationStatus !== 'rejected' &&
            verificationStatus !== 'pending' &&
            verificationStatus !== 'community_review' &&
            verificationStatus !== 'ai_approved' && (
              <motion.div
                key="camera-stage"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                variants={fadeUp}
                custom={0}
                className="mb-16"
              >
                <motion.h2
                  variants={fadeUp}
                  custom={0}
                  className="text-2xl md:text-3xl font-black text-center mb-10"
                >
                  التقاط <span className="text-sovereign-gold">الصورة</span>
                </motion.h2>

                <GlassPanel
                  className="p-6 md:p-10 rounded-[2.5rem]"
                  variant="obsidian"
                  gradientBorder
                >
                  {/* AI Analysis State */}
                  {isAiAnalyzing && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="py-12 text-center"
                    >
                      <div className="relative w-32 h-32 mx-auto mb-8">
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-sovereign-gold/20"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full border-4 border-transparent border-t-sovereign-gold"
                          animate={{ rotate: -360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-sovereign-gold" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-sovereign-gold">جارٍ التحليل بالذكاء الاصطناعي</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        يتم فحص جودة الصورة ووضوح الوجه والتأكد من مطابقة المعايير المطلوبة
                      </p>
                      <div className="mt-6 flex justify-center gap-4">
                        {['فحص الجودة', 'كشف الوجه', 'التحقق من الوضوح'].map((step, i) => (
                          <motion.div
                            key={step}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.5 }}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground"
                          >
                            <Loader2 className="w-3 h-3 animate-spin text-sovereign-gold" />
                            {step}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Captured Photo Preview */}
                  {!isAiAnalyzing && capturedPhoto && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="text-center"
                    >
                      <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden border-4 border-sovereign-gold/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={capturedPhoto}
                          alt="الصورة الملتقطة"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 rounded-full border-2 border-sovereign-gold/50 pointer-events-none" />
                      </div>
                      <h3 className="text-lg font-bold mb-1 text-emerald-400">تم التقاط الصورة بنجاح</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        تحقق من الصورة ثم اضغط على زر التحليل
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <SovereignButton
                          variant="primary"
                          size="md"
                          onClick={submitForAI}
                          isLoading={isAiAnalyzing}
                        >
                          <Sparkles className="w-4 h-4" />
                          تحليل بالذكاء الاصطناعي
                        </SovereignButton>
                        <SovereignButton
                          variant="secondary"
                          size="md"
                          onClick={retakePhoto}
                        >
                          <RotateCcw className="w-4 h-4" />
                          إعادة التقاط
                        </SovereignButton>
                      </div>
                    </motion.div>
                  )}

                  {/* Camera Feed */}
                  {!isAiAnalyzing && !capturedPhoto && !cameraActive && !cameraError && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="text-center py-8"
                    >
                      <div className="w-64 h-64 mx-auto mb-6 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                        <Camera className="w-16 h-16 text-sovereign-gold/50" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">التقط صورة لوجهك</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        تأكد من إضاءة جيدة ووضع وجهك داخل الإطار مع النظر مباشرة للكاميرا
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <SovereignButton variant="primary" size="md" onClick={startCamera}>
                          <Camera className="w-4 h-4" />
                          تشغيل الكاميرا
                        </SovereignButton>
                        <SovereignButton
                          variant="secondary"
                          size="md"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4" />
                          رفع صورة
                        </SovereignButton>
                      </div>
                    </motion.div>
                  )}

                  {/* Camera Error / File Upload Fallback */}
                  {!isAiAnalyzing && !capturedPhoto && cameraError && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="text-center py-8"
                    >
                      <div className="w-64 h-64 mx-auto mb-6 rounded-full border-2 border-dashed border-red-500/20 flex items-center justify-center bg-red-500/5">
                        <CameraOff className="w-16 h-16 text-red-400/50" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-red-400">لا يمكن الوصول للكاميرا</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        يبدو أن الكاميرا غير متاحة. يمكنك رفع صورة شخصية من جهازك بدلاً من ذلك.
                      </p>
                      <SovereignButton
                        variant="primary"
                        size="md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4" />
                        رفع صورة من الجهاز
                      </SovereignButton>
                    </motion.div>
                  )}

                  {/* Active Camera */}
                  {!isAiAnalyzing && !capturedPhoto && cameraActive && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="text-center"
                    >
                      <div className="relative w-64 h-64 mx-auto mb-6 rounded-full overflow-hidden">
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          playsInline
                          muted
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        {/* Face Guide Overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          <svg
                            viewBox="0 0 256 256"
                            className="w-full h-full"
                            style={{ transform: 'scaleX(-1)' }}
                          >
                            <ellipse
                              cx="128"
                              cy="120"
                              rx="70"
                              ry="90"
                              fill="none"
                              stroke="rgba(234,179,8,0.6)"
                              strokeWidth="2"
                              strokeDasharray="8 4"
                            />
                            <ellipse
                              cx="128"
                              cy="120"
                              rx="70"
                              ry="90"
                              fill="rgba(234,179,8,0.05)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                        {/* Corner Guides */}
                        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-sovereign-gold/60 rounded-tr-lg" />
                        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-sovereign-gold/60 rounded-tl-lg" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-sovereign-gold/60 rounded-br-lg" />
                        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-sovereign-gold/60 rounded-bl-lg" />
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        ضع وجهك داخل الإطار ثم اضغط على زر الالتقاط
                      </p>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.div whileTap={{ scale: 0.9 }}>
                          <button
                            onClick={capturePhoto}
                            className="w-20 h-20 rounded-full bg-gradient-to-b from-sovereign-gold to-amber-600 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.4)] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] transition-shadow duration-300"
                          >
                            <Camera className="w-8 h-8 text-sovereign-black" />
                          </button>
                        </motion.div>
                        <SovereignButton
                          variant="ghost"
                          size="md"
                          onClick={stopCamera}
                        >
                          <XCircle className="w-4 h-4" />
                          إلغاء
                        </SovereignButton>
                      </div>
                    </motion.div>
                  )}

                  {/* Hidden canvas for capture */}
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                </GlassPanel>
              </motion.div>
            )}

          {/* Stage 2: Community Review Progress */}
          {(verificationStatus === 'pending' ||
            verificationStatus === 'ai_approved' ||
            verificationStatus === 'community_review') &&
            !isAiAnalyzing &&
            !capturedPhoto &&
            !cameraActive && (
              <motion.div
                key="community-review-stage"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                variants={fadeUp}
                custom={0}
                className="mb-16"
              >
                <motion.h2
                  variants={fadeUp}
                  custom={0}
                  className="text-2xl md:text-3xl font-black text-center mb-10"
                >
                  المراجعة <span className="text-sovereign-gold">المجتمعية</span>
                </motion.h2>

                <GlassPanel
                  className="p-6 md:p-10 rounded-[2.5rem]"
                  variant="obsidian"
                  gradientBorder
                >
                  {/* Waiting State */}
                  {verificationStatus === 'pending' ? (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={scaleIn}
                      className="text-center py-8"
                    >
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-24 h-24 text-sovereign-gold/60" />
                        </motion.div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-sovereign-gold">قيد التحليل بالذكاء الاصطناعي</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        يتم حالياً تحليل صورتك بالذكاء الاصطناعي للتحقق من الجودة والمطابقة. سيتم الانتقال للمراجعة المجتمعية تلقائياً.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      {/* Community Review Active */}
                      <div className="text-center mb-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"
                        >
                          <Users className="w-8 h-8 text-amber-400" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2">قيد المراجعة المجتمعية</h3>
                        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                          تم تحليل صورتك بنجاح! الآن نحتاج {formatNumber(requiredApprovals)} مستخدمين موثقين للموافقة على طلبك
                        </p>
                      </div>

                      {/* Progress */}
                      <div className="max-w-md mx-auto mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">التقدم</span>
                          <span className="text-sm font-bold text-sovereign-gold">
                            {formatNumber(approvalCount)} / {formatNumber(requiredApprovals)} موافقات
                          </span>
                        </div>
                        <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            key={approvalCount}
                            className="h-full rounded-full bg-gradient-to-l from-sovereign-gold via-amber-500 to-yellow-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${approvalProgress}%` }}
                            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          {Array.from({ length: requiredApprovals }).map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              {i < approvalCount ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <CircleCheck className="w-5 h-5 text-white/20" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Approval List */}
                      {verificationData?.approvals && verificationData.approvals.length > 0 && (
                        <div className="border-t border-white/10 pt-6 mt-6">
                          <h4 className="text-sm font-bold mb-4 text-muted-foreground">الموافقات المستلمة</h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {verificationData.approvals.map((approval, index) => (
                              <motion.div
                                key={approval.id}
                                initial="hidden"
                                animate="visible"
                                variants={slideInRight}
                                custom={index}
                                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                              >
                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{approval.voter_name}</p>
                                  {approval.comment && (
                                    <p className="text-xs text-muted-foreground truncate">{approval.comment}</p>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {new Date(approval.voted_at).toLocaleDateString('ar-SA', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Auto-refresh indicator */}
                      <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>يتم التحديث تلقائياً كل 10 ثوانٍ</span>
                      </div>
                    </>
                  )}
                </GlassPanel>
              </motion.div>
            )}

          {/* Stage 3a: Verified */}
          {verificationStatus === 'verified' && !isAiAnalyzing && !capturedPhoto && !cameraActive && (
            <motion.div
              key="verified-stage"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              variants={fadeUp}
              custom={0}
              className="mb-16"
            >
              <GlassPanel
                className="p-8 md:p-12 rounded-[2.5rem] text-center"
                variant="obsidian"
                gradientBorder
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-28 h-28 mx-auto mb-8 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]"
                >
                  <ShieldCheck className="w-14 h-14 text-emerald-400" />
                </motion.div>

                <motion.h3
                  variants={fadeUp}
                  custom={0}
                  className="text-2xl md:text-3xl font-black mb-3 text-emerald-400"
                >
                  تم توثيق هويتك بنجاح!
                </motion.h3>

                <motion.p
                  variants={fadeUp}
                  custom={1}
                  className="text-muted-foreground max-w-lg mx-auto mb-8"
                >
                  تهانينا! هويتك الآن موثقة ومتحقق منها. يمكنك الاستفادة من جميع المزايا الحصرية
                  والمشاركة في مراجعة طلبات التوثيق الأخرى.
                </motion.p>

                {verificationData?.ai_score && (
                  <motion.div
                    variants={fadeUp}
                    custom={2}
                    className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full py-2 px-5 mb-8"
                  >
                    <Star className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      درجة الذكاء الاصطناعي: {formatNumber(verificationData.ai_score)}%
                    </span>
                  </motion.div>
                )}

                {/* Unlocked Benefits */}
                <motion.div
                  variants={fadeUp}
                  custom={3}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto"
                >
                  {[
                    { icon: CheckCircle2, text: 'شارة التوثيق المميزة' },
                    { icon: CheckCircle2, text: 'وصول للمنتجات الحصرية' },
                    { icon: CheckCircle2, text: 'مراجعة طلبات التوثيق' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      variants={scaleIn}
                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20"
                    >
                      <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </GlassPanel>
            </motion.div>
          )}

          {/* Stage 3b: Rejected */}
          {(verificationStatus === 'ai_rejected' || verificationStatus === 'rejected') &&
            !isAiAnalyzing &&
            !capturedPhoto &&
            !cameraActive && (
              <motion.div
                key="rejected-stage"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                variants={fadeUp}
                custom={0}
                className="mb-16"
              >
                <GlassPanel
                  className="p-8 md:p-12 rounded-[2.5rem] text-center"
                  variant="obsidian"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-28 h-28 mx-auto mb-8 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.15)]"
                  >
                    <ShieldX className="w-14 h-14 text-red-400" />
                  </motion.div>

                  <motion.h3
                    variants={fadeUp}
                    custom={0}
                    className="text-2xl md:text-3xl font-black mb-3 text-red-400"
                  >
                    لم يتم قبول طلب التوثيق
                  </motion.h3>

                  <motion.p
                    variants={fadeUp}
                    custom={1}
                    className="text-muted-foreground max-w-lg mx-auto mb-6"
                  >
                    {verificationData?.rejection_reason ||
                      'الصورة المقدمة لا تستوفي المعايير المطلوبة. يرجى المحاولة مرة أخرى بصورة أكثر وضوحاً.'}
                  </motion.p>

                  {/* AI Issues */}
                  {verificationData?.ai_issues && verificationData.ai_issues.length > 0 && (
                    <motion.div
                      variants={fadeUp}
                      custom={2}
                      className="max-w-md mx-auto mb-8"
                    >
                      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-sm font-bold text-red-400">المشاكل المكتشفة</span>
                        </div>
                        <ul className="space-y-2">
                          {verificationData.ai_issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {/* AI Score */}
                  {verificationData?.ai_score !== undefined && (
                    <motion.div
                      variants={fadeUp}
                      custom={3}
                      className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full py-2 px-5 mb-8"
                    >
                      <Star className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-bold text-red-400">
                        درجة الذكاء الاصطناعي: {formatNumber(verificationData.ai_score)}%
                      </span>
                    </motion.div>
                  )}

                  <motion.div variants={fadeUp} custom={4}>
                    <SovereignButton
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        setVerificationStatus('not_submitted');
                        setVerificationData(null);
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      إعادة المحاولة
                    </SovereignButton>
                  </motion.div>
                </GlassPanel>
              </motion.div>
            )}
        </AnimatePresence>

        {/* ──── Community Review Queue (for verified users) ──── */}
        {is_verified && verificationStatus !== 'loading' && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-2xl md:text-3xl font-black text-center mb-3"
            >
              طوابير <span className="text-sovereign-gold">المراجعة</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-muted-foreground text-center mb-10 max-w-xl mx-auto"
            >
              ساعد في بناء مجتمع موثوق بمراجعة طلبات التوثيق المعلقة
            </motion.p>

            {loadingQueue ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" />
              </div>
            ) : pendingVerifications.length === 0 ? (
              <GlassPanel
                className="p-8 rounded-[2rem] text-center"
                variant="obsidian"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">لا توجد طلبات معلقة</h3>
                <p className="text-sm text-muted-foreground">
                  جميع طلبات التوثيق تمت مراجعتها. عد لاحقاً.
                </p>
              </GlassPanel>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
                {pendingVerifications.map((pv, index) => (
                  <motion.div
                    key={pv.id}
                    initial="hidden"
                    animate="visible"
                    variants={slideInRight}
                    custom={index}
                  >
                    <GlassPanel
                      className="p-5 rounded-[1.5rem] h-full"
                      variant="obsidian"
                    >
                      <div className="flex items-start gap-4">
                        {/* Face Photo */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                          {pv.face_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pv.face_photo_url}
                              alt={pv.user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm mb-1 truncate">{pv.user_name}</h4>

                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-sovereign-gold" />
                              <span className="text-xs text-sovereign-gold font-bold">
                                {formatNumber(pv.ai_score)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatNumber(pv.approval_count)}/{formatNumber(pv.required_approvals)}
                              </span>
                            </div>
                          </div>

                          {/* Mini Progress */}
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-sovereign-gold to-amber-500"
                              style={{
                                width: `${Math.min((pv.approval_count / pv.required_approvals) * 100, 100)}%`,
                              }}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-full h-8 text-xs px-3"
                              disabled={votingId === pv.id}
                              onClick={() =>
                                setCommentModal({ id: pv.id, vote: 'approve' })
                              }
                            >
                              {votingId === pv.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ThumbsUp className="w-3 h-3" />
                              )}
                              موافقة
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 rounded-full h-8 text-xs px-3"
                              disabled={votingId === pv.id}
                              onClick={() =>
                                setCommentModal({ id: pv.id, vote: 'reject' })
                              }
                            >
                              {votingId === pv.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ThumbsDown className="w-3 h-3" />
                              )}
                              رفض
                            </Button>
                          </div>
                        </div>
                      </div>
                    </GlassPanel>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ──── Comment Modal ──── */}
        <AnimatePresence>
          {commentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setCommentModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <GlassPanel
                  className="p-6 md:p-8 rounded-[2rem]"
                  variant="obsidian"
                  gradientBorder
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        commentModal.vote === 'approve'
                          ? 'bg-emerald-500/10 border border-emerald-500/30'
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      {commentModal.vote === 'approve' ? (
                        <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ThumbsDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold">
                      {commentModal.vote === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        تعليق (اختياري)
                      </div>
                    </label>
                    <textarea
                      value={voteComment}
                      onChange={(e) => setVoteComment(e.target.value)}
                      placeholder="أضف تعليقاً حول قرارك..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/20 transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>

                  <div className="flex gap-3">
                    <SovereignButton
                      variant={commentModal.vote === 'approve' ? 'primary' : 'danger'}
                      size="sm"
                      onClick={() =>
                        handleVote(commentModal.id, commentModal.vote, voteComment || undefined)
                      }
                      isLoading={votingId === commentModal.id}
                    >
                      {commentModal.vote === 'approve' ? 'موافقة' : 'رفض'}
                    </SovereignButton>
                    <SovereignButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCommentModal(null);
                        setVoteComment('');
                      }}
                    >
                      إلغاء
                    </SovereignButton>
                  </div>
                </GlassPanel>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ──── Benefits Section ──── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-black text-center mb-3"
          >
            مزايا <span className="text-sovereign-gold">التوثيق</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-muted-foreground text-center mb-10 max-w-xl mx-auto"
          >
            وثّق هويتك وافتح الباب لمزايا حصرية تعزز تجربتك على المنصة
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  variants={fadeUp}
                  custom={index + 2}
                >
                  <GlassPanel
                    className="p-6 rounded-[2rem] text-center h-full"
                    variant="obsidian"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-sovereign-gold" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ──── How It Works ──── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="mb-16"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-2xl md:text-3xl font-black text-center mb-10"
          >
            كيف يعمل <span className="text-sovereign-gold">التوثيق</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '١',
                title: 'التقاط الصورة',
                description: 'التقط صورة واضحة لوجهك باستخدام الكاميرا أو ارفع صورة من جهازك',
                icon: Camera,
              },
              {
                step: '٢',
                title: 'تحليل الذكاء الاصطناعي',
                description: 'يتم فحص الصورة تلقائياً للتحقق من الجودة ووضوح الوجه',
                icon: Sparkles,
              },
              {
                step: '٣',
                title: 'المراجعة المجتمعية',
                description: 'يصوّت 5 مستخدمين موثقين على طلبك لضمان النزاهة والشفافية',
                icon: Users,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.step} variants={fadeUp} custom={index + 1}>
                  <GlassPanel
                    className="p-6 rounded-[2rem] text-center h-full"
                    variant="obsidian"
                  >
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-sovereign-gold" />
                      </div>
                      <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-sovereign-gold text-sovereign-black flex items-center justify-center text-xs font-black">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-base font-bold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </GlassPanel>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ──── Security Notice ──── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12"
        >
          <GlassPanel
            className="p-6 rounded-[2rem]"
            variant="obsidian"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-right">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-muted-foreground">بياناتك مشفرة ومحمية</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-muted-foreground">لا تُشارك مع أطراف ثالثة</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-muted-foreground">مراجعة مجتمعية شفافة</span>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ──── Back to Home ──── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          custom={0}
          className="text-center"
        >
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}