"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { PrivateImage } from "./PrivateImage";

interface FullImageViewerProps {
  s3Key: string;
  onClose: () => void;
}

export function FullImageViewer({ s3Key, onClose }: FullImageViewerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
      >
        <FiX className="w-6 h-6" />
      </button>

      <div
        className="absolute inset-4 md:inset-12 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()} 
      >
        <PrivateImage
          s3Key={s3Key}
          className="w-full h-full object-contain rounded-md shadow-2xl"
        />
      </div>
    </div>
  );
}
