export class WebRTCManager {
    private socket: WebSocket | null = null;
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private roomId: string;
    private onTrack: (stream: MediaStream) => void;
    // STUN servers for NAT traversal (Google's public servers for demo)
    private config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    };

    constructor(roomId: string, onTrack: (stream: MediaStream) => void) {
        this.roomId = roomId;
        this.onTrack = onTrack;
    }

    // Connect to Signaling Server
    public connect(url: string) {
        this.socket = new WebSocket(`${url}/ws/call/${this.roomId}/`);

        this.socket.onopen = () => {
            // Connected to Signaling Server
        };

        this.socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            this.handleSignalingMessage(data);
        };
    }

    // Start Call (Initiator)
    public async startCall(localStream: MediaStream) {
        this.localStream = localStream;
        this.createPeerConnection();

        // Add local tracks to peer connection
        localStream.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, localStream);
        });

        // Create Offer
        const offer = await this.peerConnection?.createOffer();
        await this.peerConnection?.setLocalDescription(offer);

        this.sendSignalingMessage('offer', offer);
    }

    // Join Call (Receiver)
    public async joinCall(localStream: MediaStream) {
        this.localStream = localStream;
        // Peer connection will be created when Offer is received,
        // or if we already have it, we just add tracks.
        if (!this.peerConnection) {
            this.createPeerConnection();
        }
        localStream.getTracks().forEach(track => {
            this.peerConnection?.addTrack(track, localStream);
        });
    }

    private createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.config);

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage('candidate', event.candidate);
            }
        };

        this.peerConnection.ontrack = (event) => {
            // Remote track received
            this.onTrack(event.streams[0]);
        };
    }

    private async handleSignalingMessage(data: any) {
        const { type, payload } = data;

        if (!this.peerConnection) {
            this.createPeerConnection();
        }

        try {
            switch (type) {
                case 'offer':
                    await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(payload));
                    const answer = await this.peerConnection?.createAnswer();
                    await this.peerConnection?.setLocalDescription(answer);
                    this.sendSignalingMessage('answer', answer);
                    break;

                case 'answer':
                    await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(payload));
                    break;

                case 'candidate':
                    await this.peerConnection?.addIceCandidate(new RTCIceCandidate(payload));
                    break;
            }
        } catch (err) {
            console.error("Error handling signaling message:", err);
        }
    }

    private sendSignalingMessage(type: string, payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: type,
                payload: payload,
            }));
        }
    }

    public cleanup() {
        this.localStream?.getTracks().forEach(track => track.stop());
        this.peerConnection?.close();
        this.socket?.close();
        this.aiSocket?.close();
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    // --- AI Judge Features ---
    private aiSocket: WebSocket | null = null;
    private mediaRecorder: MediaRecorder | null = null;

    public connectAI(url: string, onAlert: (msg: string) => void) {
        this.aiSocket = new WebSocket(`${url}/ws/ai-judge/${this.roomId}/`);

        this.aiSocket.onopen = () => {
            // AI Judge Connected
        };

        this.aiSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'dispute_detected') {
                onAlert(data.message);
            }
        };
    }

    public startAIAnalysis() {
        if (!this.localStream || !this.aiSocket) return;

        // Use MediaRecorder to capture audio chunks
        // In a real app with 2-way audio, we'd use Web Audio API to mix streams
        // For now, we analyze the LOCAL stream (what *I* am saying)

        const options = { mimeType: 'audio/webm;codecs=opus' };
        try {
            this.mediaRecorder = new MediaRecorder(this.localStream, options);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && this.aiSocket?.readyState === WebSocket.OPEN) {
                    this.aiSocket.send(event.data);
                }
            };

            this.mediaRecorder.start(1000); // chunk every 1s
        } catch (e) {
            console.error("MediaRecorder not supported or failed", e);
        }
    }

    public stopAIAnalysis() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }
}
