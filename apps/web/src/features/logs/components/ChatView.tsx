"use client";

import {
  FiMessageSquare,
  FiImage,
  FiSend,
  FiXCircle,
  FiUser,
  FiAlertTriangle,
  FiX,
  FiLoader
} from "react-icons/fi";
import { Call, Message, Log } from "../types/logs.types";
import { Socket } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { storageApi } from "@/lib/storage.api";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { FullImageViewer } from "@/components/shared/FullImageViewer";

interface ChatViewProps {
  messages: Message[];
  logId: string;
  log?: Log;
  socket?: Socket;
  call?: Call | null;
}

export default function ChatView({
  messages: initialMessages,
  log,
  logId,
  socket,
  call,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImageKey, setViewingImageKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const onChatMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const onCallEnded = (payload: any) => {
      if (payload?.endedBy === "resident") {
        toast("The resident ended the chat.", {
          icon: <FiMessageSquare className="text-primary" />,
          id: "chat-ended",
        });
      } else if (payload?.endedBy === "system") {
        toast("The chat was ended by the system.", {
          icon: <FiAlertTriangle className="text-warning" />,
          id: "chat-ended",
        });
      }
    };

    socket.on("chat_message", onChatMessage);
    socket.on("call_ended", onCallEnded);
    return () => {
      socket.off("chat_message", onChatMessage);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, logId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validImages = files.filter((file) => file.type.startsWith("image/"));
      const invalidImages = files.filter((file) => !file.type.startsWith("image/"));

      if (invalidImages.length > 0) {
        toast.error("Only image files are allowed.");
      }

      if (selectedImages.length + validImages.length > 4) {
        toast.error("You can only attach up to 4 images per message.");
        return;
      }

      const oversizedImages = validImages.filter((file) => file.size > 5 * 1024 * 1024);
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
    if ((!text.trim() && selectedImages.length === 0) || !socket || !call?.id || isUploading) return;
    
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
          storageApi.uploadPrivateFile(file)
        );
        const results = await Promise.all(uploadPromises);
        imageKeys.push(...results.map((r) => r.key));
      }

      socket.emit(
        "send_chat_message",
        {
          callId: call.id,
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
      toast.error("Failed to upload images. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEndChat = () => {
    if (socket && call?.id) {
      socket.emit("end_call", { callId: call.id });
    }
  };

  const isEnded =
    call?.status === "ended" ||
    call?.status === "missed" ||
    call?.status === "rejected";

  const displayMessages = messages;
  const hasMessages = displayMessages.length > 0;

  return (
    <div className="flex flex-col h-full bg-background border-r border-background-subtle relative">
      {/* Header */}
      <div className="px-lg py-sm border-b border-background-subtle shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isEnded ? "bg-background-subtle" : "bg-danger/10"}`}
          >
            <FiUser
              className={`w-5 h-5 ${isEnded ? "text-foreground/50" : "text-danger"}`}
            />
          </div>
          <div className="flex flex-col">
            <p className="body-medium font-bold text-foreground leading-tight flex items-center gap-2">
              Resident
              {log?.is_shadow_banned && (
                <span className="bg-danger text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm">
                  Shadow Banned
                </span>
              )}
            </p>
            {!isEnded ? (
              <p className="body-xsmall text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                Live Chat Session
              </p>
            ) : (
              <p className="body-xsmall text-foreground/50 font-medium capitalize">
                Session {call?.status || "Ended"}
              </p>
            )}
          </div>
        </div>
        {!isEnded && (
          <button
            onClick={handleEndChat}
            className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center hover:bg-danger hover:text-white transition-colors shadow-sm"
            title="End Chat"
          >
            <FiXCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-lg custom-scrollbar">
        {hasMessages ? (
          <div className="flex flex-col gap-3">
            {displayMessages.map((msg) => {
              const isCoordinator = msg.sender_type === "coordinator";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCoordinator ? "items-end" : "items-start"} w-full`}
                >
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[80%] min-w-0">
                    {!isCoordinator && (
                      <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center shrink-0 mb-1">
                        <FiUser className="w-3 h-3 text-danger" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 w-full max-w-full min-w-0">
                      {msg.image_keys && msg.image_keys.length > 0 && (
                        <div
                          className={`grid gap-2 w-fit ${
                            isCoordinator ? "ml-auto" : "mr-auto"
                          } ${
                            msg.image_keys.length === 1
                              ? "grid-cols-1"
                              : "grid-cols-2"
                          }`}
                        >
                          {msg.image_keys.map((key) => (
                            <div
                              key={key}
                              className="relative aspect-square w-32 h-32 overflow-hidden rounded-xl cursor-pointer shadow-sm border border-background-subtle shrink-0"
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
                          className={`min-w-0 px-4 py-3 body-small shadow-sm break-words whitespace-pre-wrap max-w-full w-fit ${
                            isCoordinator
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm ml-auto"
                              : "bg-background-subtle text-foreground rounded-2xl rounded-tl-sm mr-auto"
                          }`}
                        >
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-foreground/40 mt-1 px-1">
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
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-foreground/40">
            <FiMessageSquare className="w-16 h-16 mb-lg opacity-50" />
            <p className="title-small font-medium text-foreground/60">
              No Conversations Yet
            </p>
            <p className="body-small text-center mt-2 text-foreground/40">
              Start a conversation to share information, ask questions, or
              coordinate response efforts.
            </p>
          </div>
        )}
      </div>

      {/* Message input */}
      {!isEnded && (
        <div className="px-lg py-sm border-t border-background-subtle shrink-0 bg-white flex flex-col gap-2">
          {selectedImages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {selectedImages.map((file, idx) => (
                <div key={idx} className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-background-subtle">
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
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
              onChange={(e) => {
                if (e.target.value.length <= 1000) {
                  setText(e.target.value);
                }
              }}
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message... (Shift+Enter for new line)"
              className="flex-1 px-md py-sm rounded-lg bg-background-subtle/50 border border-transparent focus:border-primary/30 focus:bg-white text-foreground body-small outline-none transition-colors resize-none min-h-[44px] max-h-32 custom-scrollbar disabled:opacity-50"
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
              className="p-2 text-foreground/40 hover:text-foreground transition-colors mb-1"
            >
              <FiImage className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={(!text.trim() && selectedImages.length === 0) || isUploading}
              className="p-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50 mb-1"
            >
              {isUploading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {viewingImageKey && (
        <FullImageViewer
          s3Key={viewingImageKey}
          onClose={() => setViewingImageKey(null)}
        />
      )}
    </div>
  );
}
