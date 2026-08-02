import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import toast from "react-hot-toast";

export function useWebRTC(
  socket: Socket | undefined,
  callId: string,
  role: "resident" | "coordinator",
) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isAcquiringMedia = useRef(false);
  const [connectionId, setConnectionId] = useState(Date.now());

  // Keep ref in sync with state for synchronous access without dependency loops
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Announce our presence to force peer sync if they are holding stale connections
  useEffect(() => {
    if (!socket || !callId) return;
    socket.emit("join_call_room", callId);
    socket.emit("webrtc_peer_ready", { callId, role });
  }, [socket, callId, role]);

  useEffect(() => {
    if (!socket || !callId) return;

    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME || "";
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL || "";

    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.relay.metered.ca:80" },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: turnUsername,
          credential: turnCredential,
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: turnUsername,
          credential: turnCredential,
        },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Attach existing local tracks to the NEW peer connection if we are rebuilding
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      setRemoteStream(stream);

      const updateVideoState = () => {
        const videoTracks = stream.getVideoTracks();
        setHasRemoteVideo(videoTracks.length > 0 && videoTracks[0].enabled);
      };

      updateVideoState();

      stream.onaddtrack = updateVideoState;
      stream.onremovetrack = updateVideoState;

      stream.getVideoTracks().forEach((track) => {
        track.onunmute = updateVideoState;
        track.onmute = updateVideoState;
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc_ice_candidate", {
          callId,
          candidate: event.candidate,
        });
      }
    };

    let makingOffer = false;
    let ignoreOffer = false;
    const isPolite = role === "coordinator";

    peerConnection.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        await peerConnection.setLocalDescription();
        socket.emit("webrtc_offer", {
          callId,
          offer: peerConnection.localDescription,
        });
      } catch (err) {
        console.error("Error during negotiation:", err);
      } finally {
        makingOffer = false;
      }
    };

    const handleOffer = async (offer: any) => {
      if (!peerConnectionRef.current) return;
      try {
        const offerCollision =
          makingOffer || peerConnectionRef.current.signalingState !== "stable";
        ignoreOffer = !isPolite && offerCollision;
        if (ignoreOffer) return;

        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(offer),
        );
        await peerConnectionRef.current.setLocalDescription();
        socket.emit("webrtc_answer", {
          callId,
          answer: peerConnectionRef.current.localDescription,
        });
      } catch (err) {
        console.error("Error handling offer:", err);
      }
    };

    const handleAnswer = async (answer: any) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleIceCandidate = async (candidate: any) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate),
        );
      } catch (e) {
        if (!ignoreOffer)
          console.error("Error adding received ice candidate", e);
      }
    };

    const handlePeerReady = (data: any) => {
      if (data.role !== role) {
        // The other peer just mounted! Rebuild our connection to sync!
        setRemoteStream(null);
        setHasRemoteVideo(false);
        setConnectionId(Date.now());
      }
    };

    socket.on("webrtc_offer", handleOffer);
    socket.on("webrtc_answer", handleAnswer);
    socket.on("webrtc_ice_candidate", handleIceCandidate);
    socket.on("webrtc_peer_ready", handlePeerReady);

    // Clean up on unmount
    return () => {
      socket.off("webrtc_offer", handleOffer);
      socket.off("webrtc_answer", handleAnswer);
      socket.off("webrtc_ice_candidate", handleIceCandidate);
      socket.off("webrtc_peer_ready", handlePeerReady);
      peerConnection.close();
    };
  }, [socket, callId, role, connectionId]);

  const startCall = async () => {
    if (localStreamRef.current || isAcquiringMedia.current) return;
    isAcquiringMedia.current = true;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          "Your current browser does not support audio calls. Please open this link in your system browser (Chrome/Safari) to use voice features.",
          { id: "media-unsupported", duration: 8000 }
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (e) {
      console.error("Error accessing media devices.", e);
      toast.error("Microphone access denied or unavailable.", {
        id: "mic-error",
      });
    } finally {
      isAcquiringMedia.current = false;
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
      localStreamRef.current = null;
    }
    setRemoteStream(null);
    setHasRemoteVideo(false);
    setIsVideoEnabled(false);
    setIsMuted(false);
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        return !audioTrack.enabled;
      }
    }
    return false;
  };

  const toggleVideo = async () => {
    if (role !== "resident") return false;

    if (isVideoEnabled) {
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current?.removeTrack(videoTrack);
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender && peerConnectionRef.current) {
          peerConnectionRef.current.removeTrack(sender);
        }
      }
      setIsVideoEnabled(false);
      return false;
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error(
            "Your current browser does not support video calls. Please open this link in your system browser (Chrome/Safari) to use video features.",
            { id: "media-unsupported", duration: 8000 }
          );
          return false;
        }
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
        });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        } else {
          setLocalStream(videoStream);
          localStreamRef.current = videoStream;
        }

        const streamToUse = localStreamRef.current || videoStream;
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(videoTrack, streamToUse);
        }
        setIsVideoEnabled(true);
        return true;
      } catch (e) {
        console.error("Error accessing camera.", e);
        toast.error("Camera access denied or unavailable.", {
          id: "camera-error",
        });
        return false;
      }
    }
  };

  const switchCamera = async () => {
    if (!isVideoEnabled || role !== "resident") return;
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error(
          "Your current browser does not support video calls. Please open this link in your system browser (Chrome/Safari) to use video features.",
          { id: "media-unsupported", duration: 8000 }
        );
        return;
      }
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });
      const newVideoTrack = videoStream.getVideoTracks()[0];

      const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStreamRef.current?.removeTrack(oldVideoTrack);
      }

      localStreamRef.current?.addTrack(newVideoTrack);

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    } catch (e) {
      console.error("Error switching camera.", e);
      toast.error("Could not switch camera.", { id: "camera-switch-error" });
    }
  };

  return {
    localStream,
    remoteStream,
    hasRemoteVideo,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    isVideoEnabled,
    facingMode,
    isMuted,
  };
}
