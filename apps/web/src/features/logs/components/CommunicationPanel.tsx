"use client";

import { Log } from "../types/logs.types";
import ChatView from "./ChatView";
import VoiceCallView from "./VoiceCallView";

interface CommunicationPanelProps {
  log: Log;
}

import { useIncomingCall } from "@/providers/IncomingCallProvider";

export default function CommunicationPanel({ log }: CommunicationPanelProps) {
  const { socket } = useIncomingCall();

  const latestCall =
    log.calls?.length > 0
      ? [...log.calls].sort(
          (a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        )[0]
      : null;

  if (latestCall?.communication_method === "chat" || log.source === "chat") {
    return (
      <ChatView
        messages={log.messages || []}
        logId={log.id}
        socket={socket}
        call={latestCall}
      />
    );
  }

  if (
    latestCall?.communication_method === "voice" ||
    log.source === "voice_call"
  ) {
    return <VoiceCallView call={latestCall} logId={log.id} socket={socket} />;
  }

  return null;
}
