"use client";

import { useState, useEffect } from "react";
import { storageApi } from "@/lib/storage.api";
import { FiImage } from "react-icons/fi";

interface PrivateImageProps {
  s3Key: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function PrivateImage({ s3Key, alt = "Image", className = "", onClick }: PrivateImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchUrl = async () => {
      try {
        setLoading(true);
        const data = await storageApi.getPrivateAccessUrl(s3Key);
        if (isMounted) {
          setUrl(data.url);
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch private image URL", err);
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [s3Key]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-background-subtle flex items-center justify-center ${className}`}>
        <FiImage className="text-foreground/20 w-1/4 h-1/4 min-w-4 min-h-4" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className={`bg-danger/10 flex items-center justify-center ${className}`}>
        <FiImage className="text-danger/50 w-1/4 h-1/4 min-w-4 min-h-4" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={`${className} ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    />
  );
}
