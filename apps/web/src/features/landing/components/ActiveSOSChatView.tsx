"use client";

import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import {
  FiX,
  FiCheck,
  FiSend,
  FiImage,
  FiMessageSquare,
  FiMapPin,
  FiLoader,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { logsApi } from "@/features/logs/api/logs.api";
import { storageApi } from "@/lib/storage.api";
import { useLiveLocation } from "../hooks/useLiveLocation";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { FullImageViewer } from "@/components/shared/FullImageViewer";

interface ActiveSOSChatViewProps {
  callId: string;
  callData: any;
  socket: Socket;
}

export default function ActiveSOSChatView({
  callId,
  callData,
  socket,
}: ActiveSOSChatViewProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sessionEndReason, setSessionEndReason] = useState<
    "resident" | "coordinator" | "system" | null
  >(null);
  const [isRetryingLocation, setIsRetryingLocation] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImageKey, setViewingImageKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useLiveLocation(socket, callId, !sessionEndReason);

  useEffect(() => {
    if (callData.logId) {
      socket.emit("join_log_room", callData.logId);
    }

    logsApi
      .getCallDetails(callId)
      .then((data) => {
        if (data?.log?.messages) {
          setMessages(data.log.messages);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      })
      .catch(console.error);

    const onChatMessage = (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const onCallEnded = (payload: any) => {
      if (payload?.endedBy === "coordinator") {
        setSessionEndReason("coordinator");
      } else if (payload?.endedBy === "system") {
        setSessionEndReason("system");
      }
    };

    socket.on("chat_message", onChatMessage);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("chat_message", onChatMessage);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, callData.logId]);

  useEffect(() => {
    if (sessionEndReason) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionEndReason]);

  const handleEndCall = () => {
    socket.emit("end_call", { callId });
    setSessionEndReason("resident");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validImages = files.filter((file) =>
        file.type.startsWith("image/"),
      );
      const invalidImages = files.filter(
        (file) => !file.type.startsWith("image/"),
      );

      if (invalidImages.length > 0) {
        toast.error("Only image files are allowed.");
      }

      if (selectedImages.length + validImages.length > 4) {
        toast.error("You can only attach up to 4 images per message.");
        return;
      }

      const oversizedImages = validImages.filter(
        (file) => file.size > 5 * 1024 * 1024,
      );
      if (oversizedImages.length > 0) {
        toast.error("Each image must be less than 5MB.");
        return;
      }

      setSelectedImages((prev) => [...prev, ...validImages]);
    }
    // Clear input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (
      (!text.trim() && selectedImages.length === 0) ||
      !socket ||
      !callId ||
      isUploading
    )
      return;

    const currentText = text.trim();
    const currentImages = [...selectedImages];
    const hasImages = currentImages.length > 0;

    setIsUploading(true);
    let toastId: string | undefined;

    if (hasImages) {
      toastId = toast.loading("Sending message...");
    }

    try {
      const imageKeys: string[] = [];
      if (hasImages) {
        const uploadPromises = currentImages.map((file) =>
          storageApi.uploadPrivateFile(file),
        );
        const results = await Promise.all(uploadPromises);
        imageKeys.push(...results.map((r) => r.key));
      }

      socket.emit(
        "send_chat_message",
        {
          callId,
          type: imageKeys.length > 0 ? "image" : "text",
          text: currentText,
          imageKeys: imageKeys.length > 0 ? imageKeys : undefined,
        },
        (response: any) => {
          if (response && response.success === false) {
            toast.error(`Message failed: ${response.error}`, { id: toastId });
          } else {
            if (hasImages) {
              toast.success("Sent", { id: toastId, duration: 1000 });
            }
            setText("");
            setSelectedImages([]);
          }
        },
      );
    } catch (error) {
      toast.error("Failed to upload images. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryLocation = () => {
    setIsRetryingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await logsApi.updateLocation(callId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationAccuracy: position.coords.accuracy,
            locationTimestamp: new Date(position.timestamp),
            locationStatus: "success",
          });
          toast.success("Location updated successfully.");
        } catch (err) {
          toast.error("Failed to update location.");
        } finally {
          setIsRetryingLocation(false);
        }
      },
      async (error) => {
        let status = "unavailable";
        if (error.code === error.PERMISSION_DENIED) status = "denied";
        else if (error.code === error.TIMEOUT) status = "timeout";

        try {
          await logsApi.updateLocation(callId, {
            locationStatus: status,
          });
        } catch (err) {}

        toast.error("Could not acquire location. Please check permissions.");
        setIsRetryingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  };

  if (sessionEndReason) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-10 max-w-[95vw] md:max-w-[50vw] w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FiCheck className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="title-medium text-gray-900 mb-2">Session Ended</h1>
          <p className="body-medium text-gray-500 mb-8">
            {sessionEndReason === "coordinator"
              ? "The coordinator has ended the emergency session."
              : sessionEndReason === "system"
                ? "The emergency session was ended by the system."
                : "You have ended the emergency session."}
          </p>
          <button
            onClick={() => (window.location.href = `/resident/log/${callId}`)}
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover transition-colors mb-3"
          >
            View Emergency Log
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col animate-in fade-in">
      <div className="p-4 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-lg font-bold text-gray-600">CC</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">Command Center</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-success text-xs font-medium">
                Active Chat
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetryLocation}
            disabled={isRetryingLocation}
            className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            title="Retry Location"
          >
            <FiMapPin
              className={`w-3.5 h-3.5 ${isRetryingLocation ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Location</span>
          </button>
          <button
            onClick={handleEndCall}
            className="text-danger hover:text-danger-hover bg-danger/10 hover:bg-danger/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            title="End Chat"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <FiMessageSquare className="w-10 h-10 text-primary/40" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Connected to Command Center
            </h2>
            <p className="text-sm text-center max-w-[250px] text-gray-500">
              Send a message to share your situation, ask questions, or get help
              immediately.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, idx) => {
              const isResident = msg.sender_type === "resident";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isResident ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 w-full`}
                >
                  <div className="flex flex-col gap-2 w-full max-w-full">
                    {msg.image_keys && msg.image_keys.length > 0 && (
                      <div
                        className={`grid gap-2 w-fit ${
                          isResident ? "ml-auto" : "mr-auto"
                        } ${
                          msg.image_keys.length === 1
                            ? "grid-cols-1"
                            : "grid-cols-2"
                        }`}
                      >
                        {msg.image_keys.map((key: string) => (
                          <div
                            key={key}
                            className="relative aspect-square w-32 h-32 overflow-hidden rounded-xl cursor-pointer shadow-sm border border-gray-100"
                            onClick={() => setViewingImageKey(key)}
                          >
                            <PrivateImage
                              s3Key={key}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.text && (
                      <div
                        className={`min-w-0 break-words whitespace-pre-wrap px-4 py-3 text-sm shadow-sm max-w-[85%] sm:max-w-[80%] w-fit ${
                          isResident
                            ? "bg-primary text-white rounded-2xl rounded-tr-sm ml-auto"
                            : "bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm mr-auto"
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    )}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2">
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {selectedImages.map((file, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-gray-200"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 mx-auto w-full">
          <textarea
            value={text}
            disabled={isUploading}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-100 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-gray-400 focus:bg-gray-50 border border-transparent focus:border-primary/30 transition-colors resize-none min-h-[44px] max-h-32 custom-scrollbar disabled:opacity-50"
            rows={1}
            ref={(el) => {
              if (el) {
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
              }
            }}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-xl mb-1"
          >
            <FiImage className="w-5 h-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={
              (!text.trim() && selectedImages.length === 0) || isUploading
            }
            className="p-3 bg-primary text-white hover:bg-primary-hover transition-colors rounded-xl disabled:opacity-50 shadow-sm mb-1"
          >
            {isUploading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {viewingImageKey && (
        <FullImageViewer
          s3Key={viewingImageKey}
          onClose={() => setViewingImageKey(null)}
        />
      )}
    </div>
  );
}
