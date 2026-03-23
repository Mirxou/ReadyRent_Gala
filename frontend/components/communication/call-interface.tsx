'use client';

import { useEffect, useRef, useState } from 'react';
import { WebRTCManager } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Bot, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for cn

interface CallInterfaceProps {
    roomId: string;
    isInitiator?: boolean;
    onEndCall: () => void;
}

export function CallInterface({ roomId, isInitiator = false, onEndCall }: CallInterfaceProps) {
    const [manager, setManager] = useState<WebRTCManager | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isAIActive, setIsAIActive] = useState(false);
    const [status, setStatus] = useState('Initializing...');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // 1. Initialize WebRTC Manager
        const rtcManager = new WebRTCManager(roomId, (stream) => {
            console.log("Setting remote stream in UI");
            setRemoteStream(stream);
            setStatus('Connected');
        });

        // Connect to Signaling Server
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
        rtcManager.connect(wsUrl);

        // AI Judge Connection
        rtcManager.connectAI(wsUrl, (msg) => {
            toast.custom((t) => (
                <div className="bg-red-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-2">
                    <ShieldAlert className="w-8 h-8 animate-pulse" />
                    <div>
                        <h4 className="font-bold text-lg">AI Judge Warning</h4>
                        <p className="text-sm">{msg}</p>
                    </div>
                </div>
            ), { duration: 5000 });
        });

        setManager(rtcManager);

        // 2. Get User Media
        async function startMedia() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);

                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                if (isInitiator) {
                    setStatus('Calling...');
                    await rtcManager.startCall(stream);
                } else {
                    setStatus('Waiting...');
                    await rtcManager.joinCall(stream);
                }

            } catch (err) {
                console.error("Error accessing media devices:", err);
                setStatus('Error: Camera/Mic blocked');
            }
        }

        startMedia();

        return () => {
            rtcManager.cleanup();
        };
    }, [roomId, isInitiator]);


    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);


    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Remote Video (Full Screen) */}
            <div className="relative flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-white text-center animate-pulse">
                        <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <span className="text-3xl">👤</span>
                        </div>
                        <p className="text-xl font-medium">{status}</p>
                    </div>
                )}

                {/* Local Video (PIP) */}
                <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={cn("w-full h-full object-cover mirror", isVideoOff && "hidden")}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                            <VideoOff className="w-8 h-8 opacity-50" />
                        </div>
                    )}
                </div>
            </div>

            {/* Controls Bar */}
            <div className="h-24 bg-black/80 backdrop-blur-md flex items-center justify-center gap-6 pb-6 relative">

                {/* AI Judge Toggle (New) */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (isAIActive) {
                                manager?.stopAIAnalysis();
                                toast.warning("⚠️ تحذير: تم إيقاف الحماية. هذه المكالمة غير موثقة ولن يتم إنشاء عقد تلقائي.");
                            } else {
                                manager?.startAIAnalysis();
                                toast.success("✅ الحماية مفعلة: المكالمة مسجلة قانونياً وتخضع للرقابة الذكية.");
                            }
                            setIsAIActive(!isAIActive);
                        }}
                        className={cn("gap-2 border transition-all duration-300",
                            isAIActive
                                ? "bg-green-500/10 text-green-500 border-green-500/50 hover:bg-green-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/50 hover:bg-red-500/20 animate-pulse"
                        )}
                    >
                        {isAIActive ? <ShieldAlert className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        {isAIActive ? "مكالمة محمية" : "غير محمية"}
                    </Button>
                    {!isAIActive && (
                        <span className="absolute left-0 -bottom-8 w-64 text-[10px] text-red-400/80 font-medium italic animate-in fade-in slide-in-from-top-1">
                            "إما عقد قانوني، أو صفقة في الهواء 🍃"
                        </span>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className={cn("w-14 h-14 rounded-full border-0 bg-white/10 hover:bg-white/20 text-white", isMuted && "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
                    onClick={toggleMute}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    className="w-16 h-16 rounded-full shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all scale-100 hover:scale-110"
                    onClick={onEndCall}
                >
                    <PhoneOff className="w-8 h-8" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className={cn("w-14 h-14 rounded-full border-0 bg-white/10 hover:bg-white/20 text-white", isVideoOff && "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
                    onClick={toggleVideo}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </Button>
            </div>

            <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
        </div>
    );
}
