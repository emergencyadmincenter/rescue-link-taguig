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
          // Proceed without location
          createLogAndRedirect();
        },
        { timeout: 5000, maximumAge: 0 }
      );
    } else {
      createLogAndRedirect();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        ref={dialogRef}
        className="bg-white rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dialog-title"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-red-50">
          <h2 id="emergency-dialog-title" className="title-medium text-danger flex items-center gap-2 font-bold">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
            </span>
            Request Emergency Assistance
          </h2>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-full hover:bg-white disabled:opacity-50"
            aria-label="Close dialog"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="body-medium text-gray-600 mb-6 text-center">
            {isSubmitting 
              ? "Connecting to emergency services..." 
              : "How would you like to communicate with an emergency coordinator?"}
          </p>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
            <button
              onClick={() => handleAction('chat')}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors mb-4">
                <FiMessageSquare className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="title-small text-gray-900 group-hover:text-primary transition-colors mb-2">Live Chat</h3>
              <p className="body-small text-gray-500 text-center">Text silently with a coordinator</p>
            </button>

            <button
              onClick={() => handleAction('voice')}
              disabled={isSubmitting}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-danger hover:bg-danger/5 transition-all group"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-danger/10 transition-colors mb-4">
                <FiPhoneCall className="w-6 h-6 text-gray-500 group-hover:text-danger transition-colors" />
              </div>
              <h3 className="title-small text-gray-900 group-hover:text-danger transition-colors mb-2">Voice Call</h3>
              <p className="body-small text-gray-500 text-center">Speak directly with a coordinator</p>
            </button>
          </div>
          
          <div className="mt-6 flex justify-center">
             <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors hover:underline disabled:opacity-50"
             >
               Cancel Request
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
