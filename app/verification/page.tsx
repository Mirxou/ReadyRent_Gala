'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { formatNumber } from '@/lib/utils';
import {
  Shield, ShieldCheck, ShieldX, Lock, Eye, CheckCircle2, XCircle, ImageIcon,
  ThumbsUp, ThumbsDown, MessageSquare, Users, Star, RefreshCw, RotateCcw, Loader2, ArrowLeft, AlertTriangle, Clock,
} from 'lucide-react';
import { GlassPanel } from '@/shared/components/sovereign/glass-panel';
import { SovereignButton } from '@/shared/components/sovereign/sovereign-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type VerificationStatus } from './_components/types';
import { getStatusConfig } from './_components/types';
import { fadeUp, scaleIn, slideInRight } from './_components/animations';
import { benefits, howItWorksSteps } from './_components/static-data';
import { useVerification } from './_components/use-verification';
import { CameraStage } from './_components/camera-stage';

export default function VerificationPage() {
  const v = useVerification();

  const approvalCount = v.verificationData?.approval_count || 0;
  const requiredApprovals = v.verificationData?.required_approvals || 5;
  const approvalProgress = Math.min((approvalCount / requiredApprovals) * 100, 100);

  const showCameraStage = (
    v.verificationStatus === 'not_submitted' || v.capturedPhoto || v.cameraActive || v.isAiAnalyzing
  ) && !['verified', 'ai_rejected', 'rejected', 'pending', 'community_review', 'ai_approved'].includes(v.verificationStatus);

  const showReviewStage = ['pending', 'ai_approved', 'community_review'].includes(v.verificationStatus) && !v.isAiAnalyzing && !v.capturedPhoto && !v.cameraActive;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-sovereign-gold/5 rounded-full blur-[160px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-sovereign-gold/3 rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Hero */}
        <motion.div initial="hidden" animate="visible" className="text-center mb-16">
          <motion.div variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-sovereign-gold/10 text-sovereign-gold border border-sovereign-gold/30 rounded-full py-1 px-4 text-xs font-bold mb-6">
              <Shield className="w-4 h-4" /> هويتك محمية وموثقة
            </div>
          </motion.div>
          <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black mb-4">
            توثيق <span className="text-sovereign-gold">الهوية</span>
          </motion.h1>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            وثّق هويتك بالذكاء الاصطناعي والمراجعة المجتمعية لتتمتع بمزايا حصرية وزيادة نقاط ثقتك
          </motion.p>
        </motion.div>

        {/* Status Card */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={0} className="mb-12">
          <GlassPanel className="p-6 md:p-8 rounded-[2rem]" variant="obsidian" gradientBorder>
            {v.verificationStatus === 'loading' ? (
              <div className="flex items-center justify-center py-6"><Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" /></div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${getStatusConfig(v.verificationStatus).bgColor} border ${getStatusConfig(v.verificationStatus).borderColor} flex items-center justify-center`}>{
                      v.verificationStatus === 'verified' ? <ShieldCheck className={`w-7 h-7 ${getStatusConfig(v.verificationStatus).color}`} /> : v.verificationStatus === 'ai_rejected' || v.verificationStatus === 'rejected' ? <ShieldX className={`w-7 h-7 ${getStatusConfig(v.verificationStatus).color}`} /> : v.verificationStatus === 'pending' || v.verificationStatus === 'ai_approved' || v.verificationStatus === 'community_review' ? <Star className={`w-7 h-7 ${getStatusConfig(v.verificationStatus).color}`} /> : <Shield className={`w-7 h-7 ${getStatusConfig(v.verificationStatus).color}`} />
                    }</div>
                    <div>
                      <h3 className="text-xl font-bold">حالة التوثيق</h3>
                      <p className="text-sm text-muted-foreground mt-1">{v.verificationStatus === 'verified' ? 'هويتك موثقة بالكامل' : v.verificationStatus === 'ai_rejected' || v.verificationStatus === 'rejected' ? 'تم رفض طلب التوثيق' : v.verificationStatus === 'community_review' || v.verificationStatus === 'ai_approved' ? `${formatNumber(approvalCount)} من ${formatNumber(requiredApprovals)} موافقات` : v.verificationStatus === 'pending' ? 'قيد التحليل بالذكاء الاصطناعي' : 'لم يتم تقديم طلب بعد'}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusConfig(v.verificationStatus).badgeColor} text-sm py-1 px-4`}>{getStatusConfig(v.verificationStatus).label}</Badge>
                </div>
                {(v.verificationStatus === 'community_review' || v.verificationStatus === 'ai_approved') && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">التقدم في المراجعة المجتمعية</span>
                      <span className="text-sm font-bold text-sovereign-gold">{formatNumber(approvalCount)} / {formatNumber(requiredApprovals)}</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                      <motion.div key={approvalCount} className="h-full rounded-full bg-gradient-to-l from-sovereign-gold to-amber-500" initial={{ width: 0 }} animate={{ width: `${approvalProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </GlassPanel>
        </motion.div>

        {/* Stages */}
        <AnimatePresence mode="wait">
          {showCameraStage && <CameraStage
            cameraActive={v.cameraActive} cameraError={v.cameraError} capturedPhoto={v.capturedPhoto} isAiAnalyzing={v.isAiAnalyzing}
            videoRef={v.videoRef} canvasRef={v.canvasRef} fileInputRef={v.fileInputRef}
            onStartCamera={v.startCamera} onStopCamera={v.stopCamera} onCapturePhoto={v.capturePhoto} onRetakePhoto={v.retakePhoto} onSubmitAI={v.submitForAI} onFileUpload={v.handleFileUpload}
          />}

          {showReviewStage && <ReviewStage
            verificationStatus={v.verificationStatus} approvalCount={approvalCount} requiredApprovals={requiredApprovals} verificationData={v.verificationData}
          />}

          {v.verificationStatus === 'verified' && !v.isAiAnalyzing && !v.capturedPhoto && !v.cameraActive && <VerifiedStage verificationData={v.verificationData} />}

          {(v.verificationStatus === 'ai_rejected' || v.verificationStatus === 'rejected') && !v.isAiAnalyzing && !v.capturedPhoto && !v.cameraActive && <RejectedStage verificationData={v.verificationData} onRetry={() => { v.setVerificationStatus('not_submitted'); v.setVerificationData(null); }} />}
        </AnimatePresence>

        {/* Community Queue */}
        {v.user?.is_verified && v.verificationStatus !== 'loading' && <CommunityQueue
          pendingVerifications={v.pendingVerifications} loadingQueue={v.loadingQueue} votingId={v.votingId}
          onVote={v.handleVote} commentModal={v.commentModal} voteComment={v.voteComment} setCommentModal={v.setCommentModal} setVoteComment={v.setVoteComment}
        />}

        {/* Benefits */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-black text-center mb-3">مزايا <span className="text-sovereign-gold">التوثيق</span></motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">وثّق هويتك وافتح الباب لمزايا حصرية تعزز تجربتك على المنصة</motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((b, idx) => { const Icon = b.icon; return (
              <motion.div key={b.title} variants={fadeUp} custom={idx + 2}>
                <GlassPanel className="p-6 rounded-[2rem] text-center h-full" variant="obsidian">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center"><Icon className="w-6 h-6 text-sovereign-gold" /></div>
                  <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </GlassPanel>
              </motion.div>
            ); })}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="mb-16">
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-black text-center mb-10">كيف يعمل <span className="text-sovereign-gold">التوثيق</span></motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorksSteps.map((item, idx) => { const Icon = item.icon; return (
              <motion.div key={item.step} variants={fadeUp} custom={idx + 1}>
                <GlassPanel className="p-6 rounded-[2rem] text-center h-full" variant="obsidian">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-sovereign-gold/10 border border-sovereign-gold/30 flex items-center justify-center"><Icon className="w-7 h-7 text-sovereign-gold" /></div>
                    <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-sovereign-gold text-sovereign-black flex items-center justify-center text-xs font-black">{item.step}</div>
                  </div>
                  <h3 className="text-base font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </GlassPanel>
              </motion.div>
            ); })}
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={0} className="mb-12">
          <GlassPanel className="p-6 rounded-[2rem]" variant="obsidian">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-right">
              <div className="flex items-center gap-3"><Lock className="w-5 h-5 text-emerald-400" /><span className="text-sm text-muted-foreground">بياناتك مشفرة ومحمية</span></div>
              <div className="hidden sm:block w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3"><Eye className="w-5 h-5 text-emerald-400" /><span className="text-sm text-muted-foreground">لا تُشارك مع أطراف ثالثة</span></div>
              <div className="hidden sm:block w-px h-5 bg-white/10" />
              <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-emerald-400" /><span className="text-sm text-muted-foreground">مراجعة مجتمعية شفافة</span></div>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={fadeUp} custom={0} className="text-center">
          <Button asChild variant="outline" className="rounded-full"><Link href="/"><ArrowLeft className="w-4 h-4 ml-2" /> العودة للرئيسية</Link></Button>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Review Stage ── */
function ReviewStage({ verificationStatus, approvalCount, requiredApprovals, verificationData }: { verificationStatus: VerificationStatus; approvalCount: number; requiredApprovals: number; verificationData: { approvals?: Array<{ id: string; voter_name: string; voted_at: string; comment?: string }> } | null }) {
  const progress = Math.min((approvalCount / requiredApprovals) * 100, 100);
  return (
    <motion.div key="community-review-stage" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={fadeUp} className="mb-16">
      <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-black text-center mb-10">المراجعة <span className="text-sovereign-gold">المجتمعية</span></motion.h2>
      <GlassPanel className="p-6 md:p-10 rounded-[2.5rem]" variant="obsidian" gradientBorder>
        {verificationStatus === 'pending' ? (
          <motion.div initial="hidden" animate="visible" variants={scaleIn} className="text-center py-8">
            <div className="relative w-24 h-24 mx-auto mb-6"><motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}><Star className="w-24 h-24 text-sovereign-gold/60" /></motion.div></div>
            <h3 className="text-xl font-bold mb-2 text-sovereign-gold">قيد التحليل بالذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">يتم حالياً تحليل صورتك بالذكاء الاصطناعي للتحقق من الجودة والمطابقة. سيتم الانتقال للمراجعة المجتمعية تلقائياً.</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center"><Users className="w-8 h-8 text-amber-400" /></motion.div>
              <h3 className="text-xl font-bold mb-2">قيد المراجعة المجتمعية</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">تم تحليل صورتك بنجاح! الآن نحتاج {formatNumber(requiredApprovals)} مستخدمين موثقين للموافقة على طلبك</p>
            </div>
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">التقدم</span>
                <span className="text-sm font-bold text-sovereign-gold">{formatNumber(approvalCount)} / {formatNumber(requiredApprovals)} موافقات</span>
              </div>
              <div className="w-full h-4 rounded-full bg-white/5 overflow-hidden">
                <motion.div key={approvalCount} className="h-full rounded-full bg-gradient-to-l from-sovereign-gold via-amber-500 to-yellow-600" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }} />
              </div>
              <div className="flex justify-between mt-2">
                {Array.from({ length: requiredApprovals }).map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>
                    {i < approvalCount ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Star className="w-5 h-5 text-white/20" />}
                  </motion.div>
                ))}
              </div>
            </div>
            {verificationData?.approvals && verificationData.approvals.length > 0 && (
              <div className="border-t border-white/10 pt-6 mt-6">
                <h4 className="text-sm font-bold mb-4 text-muted-foreground">الموافقات المستلمة</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {verificationData.approvals.map((a, idx) => (
                    <motion.div key={a.id} initial="hidden" animate="visible" variants={slideInRight} custom={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0"><ThumbsUp className="w-4 h-4 text-emerald-400" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{a.voter_name}</p>{a.comment && <p className="text-xs text-muted-foreground truncate">{a.comment}</p>}</div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(a.voted_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground"><RefreshCw className="w-3 h-3 animate-spin" /><span>يتم التحديث تلقائياً كل 10 ثوانٍ</span></div>
          </>
        )}
      </GlassPanel>
    </motion.div>
  );
}

/* ── Verified Stage ── */
function VerifiedStage({ verificationData }: { verificationData: { ai_score?: number; approvals?: Array<unknown> } | null }) {
  return (
    <motion.div key="verified-stage" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={fadeUp} className="mb-16">
      <GlassPanel className="p-8 md:p-12 rounded-[2.5rem] text-center" variant="obsidian" gradientBorder>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-28 h-28 mx-auto mb-8 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.15)]"><ShieldCheck className="w-14 h-14 text-emerald-400" /></motion.div>
        <motion.h3 variants={fadeUp} className="text-2xl md:text-3xl font-black mb-3 text-emerald-400">تم توثيق هويتك بنجاح!</motion.h3>
        <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto mb-8">تهانينا! هويتك الآن موثقة ومتحقق منها. يمكنك الاستفادة من جميع المزايا الحصرية والمشاركة في مراجعة طلبات التوثيق الأخرى.</motion.p>
        {verificationData?.ai_score && (
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full py-2 px-5 mb-8">
            <Star className="w-4 h-4 text-emerald-400" /><span className="text-sm font-bold text-emerald-400">درجة الذكاء الاصطناعي: {formatNumber(verificationData.ai_score)}%</span>
          </motion.div>
        )}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[{ icon: CheckCircle2, text: 'شارة التوثيق المميزة' }, { icon: CheckCircle2, text: 'وصول للمنتجات الحصرية' }, { icon: CheckCircle2, text: 'مراجعة طلبات التوثيق' }].map((item, i) => (
            <motion.div key={i} variants={scaleIn} className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <item.icon className="w-4 h-4 text-emerald-400 flex-shrink-0" /><span className="text-sm font-medium">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </GlassPanel>
    </motion.div>
  );
}

/* ── Rejected Stage ── */
function RejectedStage({ verificationData, onRetry }: { verificationData: { rejection_reason?: string; ai_issues?: string[]; ai_score?: number } | null; onRetry: () => void }) {
  return (
    <motion.div key="rejected-stage" initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} variants={fadeUp} className="mb-16">
      <GlassPanel className="p-8 md:p-12 rounded-[2.5rem] text-center" variant="obsidian">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} className="w-28 h-28 mx-auto mb-8 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.15)]"><ShieldX className="w-14 h-14 text-red-400" /></motion.div>
        <motion.h3 variants={fadeUp} className="text-2xl md:text-3xl font-black mb-3 text-red-400">لم يتم قبول طلب التوثيق</motion.h3>
        <motion.p variants={fadeUp} className="text-muted-foreground max-w-lg mx-auto mb-6">{verificationData?.rejection_reason || 'الصورة المقدمة لا تستوفي المعايير المطلوبة. يرجى المحاولة مرة أخرى بصورة أكثر وضوحاً.'}</motion.p>
        {verificationData?.ai_issues && verificationData.ai_issues.length > 0 && (
          <motion.div variants={fadeUp} className="max-w-md mx-auto mb-8">
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-red-400">المشاكل المكتشفة</span></div>
              <ul className="space-y-2">{verificationData.ai_issues.map((issue, i) => (<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />{issue}</li>))}</ul>
            </div>
          </motion.div>
        )}
        {verificationData?.ai_score !== undefined && (
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-full py-2 px-5 mb-8">
            <Star className="w-4 h-4 text-red-400" /><span className="text-sm font-bold text-red-400">درجة الذكاء الاصطناعي: {formatNumber(verificationData.ai_score)}%</span>
          </motion.div>
        )}
        <motion.div variants={fadeUp}><SovereignButton variant="primary" size="lg" onClick={onRetry}><RotateCcw className="w-4 h-4" /> إعادة المحاولة</SovereignButton></motion.div>
      </GlassPanel>
    </motion.div>
  );
}

/* ── Community Queue ── */
function CommunityQueue({ pendingVerifications, loadingQueue, votingId, onVote, commentModal, voteComment, setCommentModal, setVoteComment }: {
  pendingVerifications: Array<{ id: string; user_name: string; face_photo_url: string; ai_score: number; approval_count: number; required_approvals: number; submitted_at: string }>; loadingQueue: boolean; votingId: string | null; onVote: (id: string, vote: 'approve' | 'reject', comment?: string) => void; commentModal: { id: string; vote: 'approve' | 'reject' } | null; voteComment: string; setCommentModal: (v: { id: string; vote: 'approve' | 'reject' } | null) => void; setVoteComment: (v: string) => void;
}) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="mb-16">
      <motion.h2 variants={fadeUp} custom={0} className="text-2xl md:text-3xl font-black text-center mb-3">طوابير <span className="text-sovereign-gold">المراجعة</span></motion.h2>
      <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">ساعد في بناء مجتمع موثوق بمراجعة طلبات التوثيق المعلقة</motion.p>
      {loadingQueue ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-sovereign-gold animate-spin" /></div>
      ) : pendingVerifications.length === 0 ? (
        <GlassPanel className="p-8 rounded-[2rem] text-center" variant="obsidian"><CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" /><h3 className="text-lg font-bold mb-2">لا توجد طلبات معلقة</h3><p className="text-sm text-muted-foreground">جميع طلبات التوثيق تمت مراجعتها. عد لاحقاً.</p></GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
          {pendingVerifications.map((pv, idx) => (
            <motion.div key={pv.id} initial="hidden" animate="visible" variants={slideInRight} custom={idx}>
              <GlassPanel className="p-5 rounded-[1.5rem] h-full" variant="obsidian">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
                    {pv.face_photo_url ? (// eslint-disable-next-line @next/next/no-img-element
                      <img src={pv.face_photo_url} alt={pv.user_name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground" /></div>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm mb-1 truncate">{pv.user_name}</h4>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1"><Star className="w-3 h-3 text-sovereign-gold" /><span className="text-xs text-sovereign-gold font-bold">{formatNumber(pv.ai_score)}%</span></div>
                      <div className="flex items-center gap-1"><Users className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{formatNumber(pv.approval_count)}/{formatNumber(pv.required_approvals)}</span></div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden mb-3"><div className="h-full rounded-full bg-gradient-to-l from-sovereign-gold to-amber-500" style={{ width: `${Math.min((pv.approval_count / pv.required_approvals) * 100, 100)}%` }} /></div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-full h-8 text-xs px-3" disabled={votingId === pv.id} onClick={() => setCommentModal({ id: pv.id, vote: 'approve' })}>
                        {votingId === pv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} موافقة
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 rounded-full h-8 text-xs px-3" disabled={votingId === pv.id} onClick={() => setCommentModal({ id: pv.id, vote: 'reject' })}>
                        {votingId === pv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3" />} رفض
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      )}
      {/* Comment Modal */}
      <AnimatePresence>{commentModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setCommentModal(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <GlassPanel className="p-6 md:p-8 rounded-[2rem]" variant="obsidian" gradientBorder>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${commentModal.vote === 'approve' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                  {commentModal.vote === 'approve' ? <ThumbsUp className="w-5 h-5 text-emerald-400" /> : <ThumbsDown className="w-5 h-5 text-red-400" />}
                </div>
                <h3 className="text-lg font-bold">{commentModal.vote === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}</h3>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-muted-foreground" /> تعليق (اختياري)</div></label>
                <textarea value={voteComment} onChange={(e) => setVoteComment(e.target.value)} placeholder="أضف تعليقاً حول قرارك..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-sovereign-gold/50 focus:ring-1 focus:ring-sovereign-gold/20 transition-colors placeholder:text-muted-foreground/50" />
              </div>
              <div className="flex gap-3">
                <SovereignButton variant={commentModal.vote === 'approve' ? 'primary' : 'danger'} size="sm" onClick={() => onVote(commentModal.id, commentModal.vote, voteComment || undefined)} isLoading={votingId === commentModal.id}>{commentModal.vote === 'approve' ? 'موافقة' : 'رفض'}</SovereignButton>
                <SovereignButton variant="ghost" size="sm" onClick={() => { setCommentModal(null); setVoteComment(''); }}>إلغاء</SovereignButton>
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}
