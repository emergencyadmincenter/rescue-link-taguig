"use client";

import { Log } from "../types/logs.types";
import ChatView from "./ChatView";
import VoiceCallView from "./VoiceCallView";

interface CommunicationPanelProps {
  log: Log;
  socket?: any;
}

export default function CommunicationPanel({ log, socket }: CommunicationPanelProps) {

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
        socket={socket || undefined}
        call={latestCall}
      />
    );
  }

  if (
    latestCall?.communication_method === "voice" ||
    log.source === "voice_call"
  ) {
    return <VoiceCallView call={latestCall} logId={log.id} socket={socket || undefined} />;
  }

  return null;
}
