"use client";

import {
  FiMessageSquare,
  FiImage,
  FiSend,
  FiXCircle,
  FiUser,
  FiAlertTriangle,
} from "react-icons/fi";
import { Call, Message } from "../types/logs.types";
import { Socket } from "socket.io-client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ChatViewProps {
  messages: Message[];
  logId: string;
  socket?: Socket;
  call?: Call | null;
}

export default function ChatView({
  messages: initialMessages,
  logId,
  socket,
  call,
}: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
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

  const handleSend = () => {
    if (!text.trim() || !socket || !call?.id) return;
    const currentText = text;
    setText("");
    socket.emit(
      "send_chat_message",
      {
        callId: call.id,
        type: "text",
        text: currentText,
      },
      (response: any) => {
        if (response && response.success === false) {
          toast.error(`Message failed: ${response.error}`);
          setText(currentText);
        }
      },
    );
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
            <p className="body-medium font-bold text-foreground leading-tight">
              Resident
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
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[80%]">
                    {!isCoordinator && (
                      <div className="w-6 h-6 rounded-full bg-danger/10 flex items-center justify-center shrink-0 mb-1">
                        <FiUser className="w-3 h-3 text-danger" />
                      </div>
                    )}
                    <div
                      className={`min-w-0 px-4 py-3 body-small shadow-sm break-words whitespace-pre-wrap max-w-full ${
                        isCoordinator
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                          : "bg-background-subtle text-foreground rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
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
        <div className="px-lg py-sm border-t border-background-subtle shrink-0 bg-white">
          <div className="flex items-end gap-2 mx-auto">
            <textarea
              value={text}
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
              className="flex-1 px-md py-sm rounded-lg bg-background-subtle/50 border border-transparent focus:border-primary/30 focus:bg-white text-foreground body-small outline-none transition-colors resize-none min-h-[44px] max-h-32 custom-scrollbar"
              rows={1}
              ref={(el) => {
                if (el) {
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
                }
              }}
            />
            <button
              onClick={() =>
                toast.error("Image upload is currently unavailable.")
              }
              className="p-2 text-foreground/40 hover:text-foreground transition-colors mb-1"
            >
              <FiImage className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="p-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50 mb-1"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
