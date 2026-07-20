"use client";

import React, { useEffect, useRef, useState } from "react";
import { FiMessageSquare, FiPhoneCall, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { logsApi } from "@/features/logs/api/logs.api";

export interface EmergencyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmergencyDialog({ isOpen, onClose }: EmergencyDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen) return null;

  const handleAction = async (method: 'voice' | 'chat') => {
    setIsSubmitting(true);
    let latitude: number | undefined;
    let longitude: number | undefined;

    const createLogAndRedirect = async () => {
      try {
        const data = await logsApi.createEmergency({
          communicationMethod: method,
          latitude,
          longitude,
        });

        if (data && data.id) {
          router.push(`/sos/${data.id}`);
          onClose();
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to connect to emergency services. Please call 911 directly if possible.');
        setIsSubmitting(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          createLogAndRedirect();
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Proceed without location if denied or timed out
          createLogAndRedirect();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      createLogAndRedirect();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        ref={dialogRef}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[540px] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dialog-title"
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-white px-8 pt-10 pb-6 border-b border-gray-100/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-danger border-2 border-white shadow-sm"></span>
              </div>
              <h2 id="emergency-dialog-title" className="text-2xl font-bold text-gray-900 tracking-tight">
                Request Assistance
              </h2>
            </div>
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 -mt-2 -mr-2"
              aria-label="Close dialog"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-base text-gray-500 relative z-10 pl-7">
            {isSubmitting 
              ? "Connecting to emergency services..." 
              : "How would you like to communicate with an emergency coordinator?"}
          </p>
        </div>

        <div className="px-8 py-8 bg-white/50 backdrop-blur-sm">
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
            
            <button
              onClick={() => handleAction('chat')}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-8 bg-white border-2 border-gray-100 rounded-3xl hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300 mb-5 shadow-sm">
                <FiMessageSquare className="w-7 h-7 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-2">Live Chat</h3>
              <p className="text-sm text-gray-500 text-center leading-relaxed">Text silently with a coordinator</p>
            </button>

            <button
              onClick={() => handleAction('voice')}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-danger/[0.02] border-2 border-danger/20 rounded-3xl hover:border-danger hover:shadow-[0_8px_30px_rgb(225,29,72,0.15)] transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-danger/0 group-hover:bg-danger/[0.03] transition-colors duration-300"></div>
              <div className="w-16 h-16 bg-danger/10 rounded-2xl flex items-center justify-center group-hover:bg-danger group-hover:scale-110 transition-all duration-300 mb-5 relative z-10 shadow-sm group-hover:shadow-[0_0_20px_rgb(225,29,72,0.4)]">
                <FiPhoneCall className="w-7 h-7 text-danger group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-danger transition-colors mb-2 relative z-10">Voice Call</h3>
              <p className="text-sm text-gray-600 text-center leading-relaxed relative z-10">Speak directly with a coordinator</p>
            </button>

          </div>
          
          <div className="mt-8 flex justify-center">
             <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors hover:underline disabled:opacity-50 px-4 py-2 rounded-lg"
             >
               Cancel Request
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
