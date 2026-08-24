'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store';
import { verificationApi } from '@/lib/api';
import { type VerificationStatus, type VerificationData, type PendingVerification, mapPendingVerification } from './types';

export function useVerification() {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('loading');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{ id: string; vote: 'approve' | 'reject' } | null>(null);
  const [voteComment, setVoteComment] = useState('');

  const { user, isAuthenticated } = useAuthStore();

  // Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraActive(true);
    } catch { setCameraError(true); toast.error('لا يمكن الوصول إلى الكاميرا. يمكنك رفع صورة بدلاً من ذلك.'); }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setCapturedPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => { setCapturedPhoto(null); startCamera(); }, [startCamera]);

  useEffect(() => { return () => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } }; }, []);

  // File upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار ملف صورة (JPG, PNG, WebP)'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('حجم الصورة يتجاوز 10 ميغابايت'); return; }
    const reader = new FileReader();
    reader.onload = () => setCapturedPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await verificationApi.getStatus();
      if (data) {
        setVerificationStatus(data.status || 'not_submitted');
        setVerificationData({
          status: data.status || 'not_submitted',
          ai_score: data.ai_score, ai_quality: data.ai_analysis?.face_quality,
          ai_issues: data.ai_analysis?.issues,
          approval_count: data.approval_count, required_approvals: data.required_approvals,
          rejection_reason: data.rejection_reason, face_photo_url: data.face_photo_url, submitted_at: data.created_at,
          approvals: Array.isArray(data.votes) ? data.votes.filter((v: Record<string, string>) => v.vote === 'approve').map((v: Record<string, string>) => ({ id: v.voter_id, voter_name: v.voter_first_name && v.voter_last_name ? `${v.voter_first_name} ${v.voter_last_name}` : v.voter_username || 'موثق', voted_at: v.created_at, comment: v.comment })) : [],
        });
      }
    } catch { setVerificationStatus('not_submitted'); }
  }, []);

  // Submit for AI
  const submitForAI = useCallback(async () => {
    if (!capturedPhoto) { toast.error('يرجى التقاط صورة أو رفع واحدة أولاً'); return; }
    setIsAiAnalyzing(true);
    try {
      const { data } = await verificationApi.submit(capturedPhoto);
      if (data?.status === 'ai_approved' || data?.status === 'community_review') toast.success('تم تحليل الصورة بنجاح! صورتك الآن قيد المراجعة المجتمعية.');
      else if (data?.status === 'ai_rejected') toast.error('لم يتم قبول الصورة. يرجى المحاولة مرة أخرى.');
      else toast.success('تم إرسال الصورة بنجاح');
      setVerificationStatus(data?.status || 'pending'); setCapturedPhoto(null); fetchStatus();
    } catch { toast.error('فشل إرسال الصورة. يرجى المحاولة مرة أخرى.'); }
    finally { setIsAiAnalyzing(false); }
  }, [capturedPhoto, fetchStatus]);

  // Auto-refresh status for pending states (intentional one-shot set on mount to hydrate status)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!isAuthenticated) { setVerificationStatus('not_submitted'); return; } fetchStatus(); }, [isAuthenticated, fetchStatus]);
   
  useEffect(() => {
    const needs = verificationStatus === 'pending' || verificationStatus === 'ai_approved' || verificationStatus === 'community_review';
    if (!needs) return;
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [verificationStatus, fetchStatus]);

  // Community queue
  const fetchPendingQueue = useCallback(async () => {
    if (!user?.is_verified) return;
    setLoadingQueue(true);
    try {
      const { data } = await verificationApi.getPending();
      const rawList = Array.isArray(data) ? data : data?.results || [];
      setPendingVerifications(rawList.map(mapPendingVerification));
    } catch { /* silently fail */ }
    finally { setLoadingQueue(false); }
  }, [user?.is_verified]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user?.is_verified) fetchPendingQueue(); }, [user?.is_verified, fetchPendingQueue]);

  const handleVote = useCallback(async (verificationId: string, vote: 'approve' | 'reject', comment?: string) => {
    setVotingId(verificationId);
    try {
      await verificationApi.vote(verificationId, vote, comment);
      toast.success(vote === 'approve' ? 'تمت الموافقة بنجاح' : 'تم الرفض');
      setCommentModal(null); setVoteComment(''); fetchPendingQueue();
    } catch { toast.error('فشل تسجيل التصويت'); }
    finally { setVotingId(null); }
  }, [fetchPendingQueue]);

  return {
    verificationStatus, verificationData, isAiAnalyzing, capturedPhoto, cameraActive, cameraError,
    videoRef, canvasRef, fileInputRef,
    pendingVerifications, loadingQueue, votingId, commentModal, voteComment,
    setCommentModal, setVoteComment,
    startCamera, stopCamera, capturePhoto, retakePhoto, handleFileUpload, submitForAI,
    fetchStatus, handleVote, user, isAuthenticated,
  };
}