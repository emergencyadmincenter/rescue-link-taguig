"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/lib/socket';
import { getCookie } from '@/lib/cookies';
import { useRouter, usePathname } from 'next/navigation';
import { FiPhoneIncoming, FiX, FiCheck } from 'react-icons/fi';
import { logsApi } from '@/features/logs/api/logs.api';

const IncomingCallContext = createContext<any>(null);

export function IncomingCallProvider({ children }: { children: React.ReactNode }) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const pathname = usePathname();

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCallId, setActiveCallIdState] = useState<string | null>(null);
  const [activeLogId, setActiveLogIdState] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const ringtoneRef = useRef<any>(null);

  // Synchronize activeCallId with localStorage and verify its state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('activeCallId');
      if (stored) {
        setActiveCallIdState(stored);
        
        // Verify if the call is still active on the server
        logsApi.getCallDetails(stored)
          .then((data) => {
            const status = data?.call?.status;
            if (status === 'ended' || status === 'rejected' || status === 'missed') {
              setActiveCallIdState(null);
              setActiveLogIdState(null);
              localStorage.removeItem('activeCallId');
              localStorage.removeItem('activeLogId');
            }
          })
          .catch((err) => {
            console.error('Failed to verify active call state', err);
            // If the call was deleted or not found, clear it
            if (err?.response?.status === 404) {
              setActiveCallIdState(null);
              setActiveLogIdState(null);
              localStorage.removeItem('activeCallId');
              localStorage.removeItem('activeLogId');
            }
          });
      }
      
      const storedLog = localStorage.getItem('activeLogId');
      if (storedLog) setActiveLogIdState(storedLog);
    }
  }, []);

  const setActiveCallId = useCallback((id: string | null, logId?: string | null) => {
    setActiveCallIdState(id);
    setActiveLogIdState(logId || null);
    if (id) {
      localStorage.setItem('activeCallId', id);
    } else {
      localStorage.removeItem('activeCallId');
    }
    if (logId) {
      localStorage.setItem('activeLogId', logId);
    } else {
      localStorage.removeItem('activeLogId');
    }
  }, []);

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
      setDeclineReason('');
    };

    const onCallEnded = (data: any) => {
      setIncomingCall((prev: any) => {
        if (prev && prev.callId === data?.callId) {
          return null; // Dismiss if the canceled call is the one currently ringing
        }
        return prev;
      });
      
      // If the currently active call ended, clear the active call state
      if (typeof window !== 'undefined' && localStorage.getItem('activeCallId') === data?.callId) {
        setActiveCallId(null);
      }
    };

    socket.on('incoming_emergency', onIncoming);
    socket.on('call_ended', onCallEnded);

    return () => {
      socket.off('incoming_emergency', onIncoming);
      socket.off('call_ended', onCallEnded);
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
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
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
        if (audioCtx.state === 'closed') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
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
        if (ringtoneRef.current.audioCtx) ringtoneRef.current.audioCtx.close().catch(() => {});
        ringtoneRef.current = null;
      }
    };
  }, [incomingCall]);

  const handleAccept = () => {
    if (!socket || !incomingCall) return;

    socket.emit('coordinator_response', {
      callId: incomingCall.callId,
      accept: true
    });
    
    if (ringtoneRef.current) {
      clearInterval(ringtoneRef.current.interval);
      if (ringtoneRef.current.audioCtx) ringtoneRef.current.audioCtx.close().catch(() => {});
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

    socket.emit('coordinator_response', {
      callId: incomingCall.callId,
      accept: false,
      rejectReason: declineReason
    });
    setIncomingCall(null);
    setShowDeclineDialog(false);
  };

  const cancelReject = () => {
    setShowDeclineDialog(false);
    setDeclineReason('');
  };

  return (
    <IncomingCallContext.Provider value={{ socket, isConnected, activeCallId, setActiveCallId, activeLogId }}>
      {children}
      
      {activeCallId && !pathname?.startsWith(`/calls/${activeCallId}`) && (
        <div className="fixed top-0 left-0 w-full z-[9999] bg-danger text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-sm font-medium">Active Emergency Session</span>
          </div>
          <button 
            onClick={() => router.push(`/calls/${activeCallId}`)}
            className="text-xs font-bold bg-white text-danger px-3 py-1.5 rounded hover:bg-red-50 transition-colors"
          >
            Return to Call
          </button>
        </div>
      )}

      {/* Incoming Call UI */}
      {incomingCall && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          {showDeclineDialog ? (
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xl w-[90vw] md:w-[600px] flex flex-col animate-in zoom-in-95">
              <h2 className="title-large text-gray-900 mb-2">Decline Emergency</h2>
              <p className="body-medium text-gray-500 mb-6">Please provide a reason for declining this request.</p>
              
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
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-[90vw] md:w-[500px] flex flex-col items-center animate-in slide-in-from-bottom-8">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center relative z-10 animate-bounce">
                <FiPhoneIncoming className="w-10 h-10 text-danger animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping z-0"></div>
            </div>

            <h2 className="title-large text-gray-900 mb-1">Incoming Emergency</h2>
            <p className="body-medium text-gray-500 mb-6">
              {incomingCall.communicationMethod === 'voice' ? 'Voice Call' : 'Live Chat'} Request
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
                <span className="body-small font-medium text-gray-500">Decline</span>
              </button>
              
              <button 
                onClick={handleAccept}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center text-white group-hover:bg-success-hover transition-colors shadow-lg shadow-success/30">
                  <FiCheck className="w-8 h-8" />
                </div>
                <span className="body-small font-medium text-success">Accept</span>
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
