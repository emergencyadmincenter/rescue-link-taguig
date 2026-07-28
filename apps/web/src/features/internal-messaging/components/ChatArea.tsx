import { useState, useRef, useEffect } from "react";
import { InternalConversation, InternalMessage, User } from "../types";
import {
  FiSend,
  FiImage,
  FiX,
  FiLoader,
  FiMessageSquare,
  FiUsers,
  FiUser,
  FiBell,
  FiBellOff,
} from "react-icons/fi";
import { storageApi } from "@/lib/storage.api";
import toast from "react-hot-toast";
import { PrivateImage } from "@/components/shared/PrivateImage";
import { FullImageViewer } from "@/components/shared/FullImageViewer";

interface ChatAreaProps {
  conversation: InternalConversation | null;
  currentUser: User;
  messages: InternalMessage[];
  onSendMessage: (text: string, imageKeys?: string[]) => void;
  onToggleMute?: (conversationId: string) => void;
}

export function ChatArea({
  conversation,
  currentUser,
  messages,
  onSendMessage,
  onToggleMute,
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewingImageKey, setViewingImageKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 text-gray-500 h-full">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <FiSend className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium">
          Select a conversation to start messaging
        </p>
      </div>
    );
  }

  const isGroup = conversation.type === "group";
  const otherUser = conversation.participants.find(
    (p) => p.id !== currentUser.id,
  );
  const title = isGroup ? conversation.name : otherUser?.name;

  const canMute = currentUser.role === "admin" || otherUser?.role !== "admin";

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validImages = files.filter((file) =>
        file.type.startsWith("image/"),
      );
      if (selectedImages.length + validImages.length > 4) {
        toast.error("You can only attach up to 4 images per message.");
        return;
      }
      setSelectedImages((prev) => [...prev, ...validImages]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && selectedImages.length === 0) || isUploading)
      return;

    const currentText = inputText.trim();
    const currentImages = [...selectedImages];

    setIsUploading(true);
    let toastId: string | undefined = undefined;
    
    if (currentImages.length > 0) {
      toastId = toast.loading("Sending media...");
    }

    try {
      const imageKeys: string[] = [];
      if (currentImages.length > 0) {
        const uploadPromises = currentImages.map((file) =>
          storageApi.uploadPrivateFile(file),
        );
        const results = await Promise.all(uploadPromises);
        imageKeys.push(...results.map((r) => r.key));
      }

      onSendMessage(currentText, imageKeys.length > 0 ? imageKeys : undefined);
      setInputText("");
      setSelectedImages([]);
      
      if (toastId) {
        toast.success("Sent", { id: toastId, duration: 1000 });
      }
    } catch (error) {
      if (toastId) {
        toast.error("Failed to upload images.", { id: toastId });
      } else {
        toast.error("Failed to send message.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
          {isGroup ? (
            <FiUsers className="w-5 h-5" />
          ) : otherUser?.avatarUrl ? (
            <img
              src={otherUser.avatarUrl}
              alt={title || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <FiUser className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">
            {isGroup
              ? `${conversation.participants.length} participants`
              : "Direct Message"}
          </p>
        </div>
        {onToggleMute && canMute && (
          <button
            onClick={() => onToggleMute(conversation.id)}
            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors shrink-0"
            title={
              conversation.is_muted
                ? "Unmute conversation"
                : "Mute conversation"
            }
          >
            {conversation.is_muted ? (
              <FiBellOff className="w-5 h-5 text-gray-400" />
            ) : (
              <FiBell className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FiMessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              No messages yet
            </p>
            <p className="text-xs text-gray-500">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const sender = conversation.participants.find(
              (p) => p.id === msg.senderId,
            );

            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? "justify-end" : "justify-start gap-2"}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden self-end mb-4">
                    {sender?.avatarUrl ? (
                      <img
                        src={sender.avatarUrl}
                        alt={sender.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-4 h-4" />
                    )}
                  </div>
                )}
                <div
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}
                >
                  {!isMe && isGroup && (
                    <span className="text-[10px] text-gray-500 mb-1 ml-1">
                      {sender?.name} ({sender?.role})
                    </span>
                  )}
                  <div className="flex flex-col gap-2 w-full min-w-0">
                    {(msg as any).image_keys &&
                      (msg as any).image_keys.length > 0 && (
                        <div
                          className={`grid gap-2 w-fit ${
                            isMe ? "ml-auto" : "mr-auto"
                          } ${
                            (msg as any).image_keys.length === 1
                              ? "grid-cols-1"
                              : "grid-cols-2"
                          }`}
                        >
                          {(msg as any).image_keys.map((key: string) => (
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
                        className={`rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap max-w-full ${
                          isMe
                            ? "bg-primary text-white rounded-tr-sm ml-auto"
                            : "bg-gray-100 text-gray-900 rounded-tl-sm mr-auto"
                        }`}
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {msg.text}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 mx-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-lg py-sm border-t border-background-subtle shrink-0 bg-white flex flex-col gap-2">
        {selectedImages.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {selectedImages.map((file, idx) => (
              <div
                key={idx}
                className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden border border-background-subtle"
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
            value={inputText}
            disabled={isUploading}
            onChange={(e) => setInputText(e.target.value)}
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
            className="p-2 text-foreground/40 hover:text-foreground transition-colors mb-1 shrink-0"
          >
            <FiImage className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleSend()}
            disabled={
              (!inputText.trim() && selectedImages.length === 0) || isUploading
            }
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 mb-1"
          >
            {isUploading ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiSend className="w-4 h-4 ml-0.5" />
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
