"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useSocket } from "@/lib/socket";
import { getCookie } from "@/lib/cookies";
import { useRouter, usePathname } from "next/navigation";
import { FiPhoneIncoming, FiX, FiCheck, FiMic, FiMicOff, FiPhone, FiMaximize2 } from "react-icons/fi";
import { logsApi } from "@/features/logs/api/logs.api";
import { useWebRTC } from "@/lib/webrtc";

const IncomingCallContext = createContext<any>(null);

export function IncomingCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallId, setActiveCallIdState] = useState<string | null>(null);
  const [activeLogId, setActiveLogIdState] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const ringtoneRef = useRef<any>(null);

  const globalAudioRef = useRef<HTMLAudioElement>(null);
  const webrtc = useWebRTC(socket || undefined, activeCallId || '', "coordinator");

  useEffect(() => {
    if (activeCallId) {
      webrtc.startCall();
    } else {
      webrtc.endCall();
    }
  }, [activeCallId]);

  useEffect(() => {
    if (globalAudioRef.current) {
      if (webrtc?.remoteStream) {
        globalAudioRef.current.srcObject = null;
        globalAudioRef.current.srcObject = webrtc.remoteStream;
        globalAudioRef.current.play().catch(e => console.log("Global audio play error:", e));
      } else {
        globalAudioRef.current.srcObject = null;
      }
    }
  }, [webrtc?.remoteStream]);

  // Synchronize activeCallId with localStorage and verify its state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("activeCallId");
      if (stored) {
        setActiveCallIdState(stored);

        // Verify if the call is still active on the server
        logsApi
          .getCallDetails(stored)
          .then((data) => {
            const status = data?.call?.status;
            if (
              status === "ended" ||
              status === "rejected" ||
              status === "missed"
            ) {
              setActiveCallIdState(null);
              setActiveLogIdState(null);
              localStorage.removeItem("activeCallId");
              localStorage.removeItem("activeLogId");
            }
          })
          .catch((err) => {
            console.error("Failed to verify active call state", err);
            // If the call was deleted or not found, clear it
            if (err?.response?.status === 404) {
              setActiveCallIdState(null);
              setActiveLogIdState(null);
              localStorage.removeItem("activeCallId");
              localStorage.removeItem("activeLogId");
            }
          });
      }

      const storedLog = localStorage.getItem("activeLogId");
      if (storedLog) setActiveLogIdState(storedLog);
    }
  }, []);

  const setActiveCallId = useCallback(
    (id: string | null, logId?: string | null) => {
      setActiveCallIdState(id);
      setActiveLogIdState(logId || null);
      if (id) {
        localStorage.setItem("activeCallId", id);
      } else {
        localStorage.removeItem("activeCallId");
      }
      if (logId) {
        localStorage.setItem("activeLogId", logId);
      } else {
        localStorage.removeItem("activeLogId");
      }
    },
    [],
  );

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data: any) => {
      setActiveCallId(null); // Server says we are available, so clear any stale active call

      setIncomingCall((prev: any) => {
        if (prev) return prev; // Ignore if already ringing
        return data;
      });
      setTimeLeft(30);
      setShowDeclineDialog(false);
      setDeclineReason("");
    };

    const onCallEnded = (data: any) => {
      setIncomingCall((prev: any) => {
        if (prev && prev.callId === data?.callId) {
          return null; // Dismiss if the canceled call is the one currently ringing
        }
        return prev;
      });

      // If the currently active call ended, clear the active call state
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("activeCallId") === data?.callId
      ) {
        setActiveCallId(null);
      }
    };

    socket.on("incoming_emergency", onIncoming);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("incoming_emergency", onIncoming);
      socket.off("call_ended", onCallEnded);
      if (ringtoneRef.current) {
        clearInterval(ringtoneRef.current.interval);
        ringtoneRef.current.audioCtx.close();
        ringtoneRef.current = null;
      }
    };
  }, [socket, setActiveCallId]);

  useEffect(() => {
    if (!incomingCall) {
      if (ringtoneRef.current) {
        clearInterval(ringtoneRef.current.interval);
        ringtoneRef.current.audioCtx.close().catch(() => {});
        ringtoneRef.current = null;
      }
      return;
    }

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);

      const toneInterval = setInterval(() => {
        if (audioCtx.state === "closed") return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }, 1500);

      ringtoneRef.current = { audioCtx, interval: toneInterval };
    } catch (e) {
      console.error("Failed to play ringtone", e);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIncomingCall(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (ringtoneRef.current) {
        clearInterval(ringtoneRef.current.interval);
        if (ringtoneRef.current.audioCtx)
          ringtoneRef.current.audioCtx.close().catch(() => {});
        ringtoneRef.current = null;
      }
    };
  }, [incomingCall]);

  const handleAccept = () => {
    if (!socket || !incomingCall) return;

    socket.emit("coordinator_response", {
      callId: incomingCall.callId,
      accept: true,
    });

    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.interval);
      if (ringtoneRef.current.audioCtx)
        ringtoneRef.current.audioCtx.close().catch(() => {});
      ringtoneRef.current = null;
    }

    const callId = incomingCall.callId;
    const logId = incomingCall.logId;
    setActiveCallId(callId, logId);
    setIncomingCall(null);
    router.push(`/calls/${callId}`);
  };

  const handleRejectClick = () => {
    setShowDeclineDialog(true);
  };

  const submitReject = () => {
    if (!socket || !incomingCall) return;
    if (!declineReason.trim()) return;

    socket.emit("coordinator_response", {
      callId: incomingCall.callId,
      accept: false,
      rejectReason: declineReason,
    });
    setIncomingCall(null);
    setShowDeclineDialog(false);
  };

  const cancelReject = () => {
    setShowDeclineDialog(false);
    setDeclineReason("");
  };

  return (
    <IncomingCallContext.Provider
      value={{
        socket,
        isConnected,
        activeCallId,
        setActiveCallId,
        activeLogId,
        webrtc,
      }}
    >
      {/* Global persistent audio element to prevent autoplay dropouts */}
      <audio key={activeCallId || "idle"} ref={globalAudioRef} autoPlay />
      {children}

      {activeCallId && !pathname?.startsWith(`/calls/${activeCallId}`) && (
        <FloatingCallWindow 
          webrtc={webrtc} 
          activeCallId={activeCallId} 
          router={router} 
          socket={socket} 
        />
      )}

      {/* Incoming Call UI */}
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          {showDeclineDialog ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90vw] md:w-[600px] flex flex-col animate-in zoom-in-95">
              <h2 className="title-large text-gray-900 mb-2">
                Decline Emergency
              </h2>
              <p className="body-medium text-gray-500 mb-6">
                Please provide a reason for declining this request.
              </p>

              <textarea
                autoFocus
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="E.g., Currently handling another dispatch, unavailable..."
                className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-danger focus:border-danger resize-none h-32 mb-6 text-sm"
              />

              <div className="flex gap-4 justify-end">
                <button
                  onClick={cancelReject}
                  className="px-6 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  disabled={!declineReason.trim()}
                  className="px-6 py-2.5 rounded-xl font-medium text-white bg-danger hover:bg-danger-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-10 w-[90vw] md:w-[500px] flex flex-col items-center animate-in slide-in-from-bottom-8">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center relative z-10 animate-bounce">
                  <FiPhoneIncoming className="w-10 h-10 text-danger animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping z-0"></div>
              </div>

              <h2 className="title-large text-gray-900 mb-1">
                Incoming Emergency
              </h2>
              <p className="body-medium text-gray-500 mb-6">
                {incomingCall.communicationMethod === "voice"
                  ? "Voice Call"
                  : "Live Chat"}{" "}
                Request
              </p>

              <div className="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden">
                <div
                  className="bg-danger h-full transition-all duration-1000 linear"
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                ></div>
              </div>

              <div className="flex gap-6 w-full justify-center">
                <button
                  onClick={handleRejectClick}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-gray-200 transition-colors">
                    <FiX className="w-8 h-8" />
                  </div>
                  <span className="body-small font-medium text-gray-500">
                    Decline
                  </span>
                </button>

                <button
                  onClick={handleAccept}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white group-hover:bg-success-hover transition-colors shadow-lg shadow-success/30">
                    <FiCheck className="w-8 h-8" />
                  </div>
                  <span className="body-small font-medium text-success">
                    Accept
                  </span>
                </button>
              </div>
            </div>
          )}
          {/* Audio Ringtone (optional) */}
          {/* <audio src="/sounds/ringtone.mp3" autoPlay loop /> */}
        </div>
      )}
    </IncomingCallContext.Provider>
  );
}

export const useIncomingCall = () => useContext(IncomingCallContext);

const FloatingCallWindow = ({ webrtc, activeCallId, router, socket }: any) => {
  const { remoteStream, hasRemoteVideo, isMuted, toggleMute, endCall } = webrtc;
  
  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Use a callback ref to guarantee the video stream is attached the exact moment the element mounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      if (remoteStream) {
        node.srcObject = null;
        node.srcObject = remoteStream;
        node.play().catch(e => console.log("Floating video play error:", e));
      } else {
        node.srcObject = null;
      }
    }
  }, [remoteStream, hasRemoteVideo]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !position) {
      setPosition({ x: window.innerWidth - 300 - 24, y: window.innerHeight - 350 - 24 });
    }
  }, [position]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // Ignore drag on buttons
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position?.x || 0,
      initialY: position?.y || 0
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (!position) return null;

  const handleEndCall = () => {
    if (socket) socket.emit("end_call", { callId: activeCallId });
    endCall();
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      className="fixed top-0 left-0 w-72 bg-black rounded-2xl shadow-2xl z-[9999] overflow-hidden flex flex-col border border-white/10"
    >
      {/* Video Area */}
      <div className="relative w-full aspect-[4/3] bg-gray-900 flex items-center justify-center pointer-events-none">
        {hasRemoteVideo ? (
          <video
            ref={videoCallbackRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center">
            <span className="text-3xl">🏃</span>
          </div>
        )}
        
        {/* Status Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-md">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-white">Active Call</span>
        </div>
        
        {/* Return to Call Button */}
        <button
          onClick={() => router.push(`/calls/${activeCallId}`)}
          className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-md text-white transition-colors pointer-events-auto"
          title="Return to full view"
        >
          <FiMaximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 bg-background border-t border-background-subtle flex items-center justify-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm pointer-events-auto ${
            isMuted
              ? "bg-danger/10 text-danger"
              : "bg-background-subtle text-foreground hover:bg-foreground/10"
          }`}
        >
          {isMuted ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEndCall();
          }}
          className="w-12 h-12 rounded-full bg-danger flex items-center justify-center hover:bg-danger-hover transition-colors shadow-lg transform pointer-events-auto"
        >
          <FiPhone className="w-5 h-5 text-white rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};
