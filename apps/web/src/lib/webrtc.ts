import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export function useWebRTC(socket: Socket | undefined, callId: string, role: 'resident' | 'coordinator') {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (!socket || !callId) return;

    const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);

      stream.onaddtrack = () => {
        setRemoteStream(new MediaStream(stream.getTracks()));
      };
      
      stream.onremovetrack = () => {
        setRemoteStream(new MediaStream(stream.getTracks()));
      };
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', { callId, candidate: event.candidate });
      }
    };

    let makingOffer = false;
    let ignoreOffer = false;
    const isPolite = role === 'coordinator';

    peerConnection.onnegotiationneeded = async () => {
      try {
        makingOffer = true;
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('webrtc_offer', { callId, offer });
      } catch (err) {
        console.error('Error during negotiation:', err);
      } finally {
        makingOffer = false;
      }
    };

    socket.on('webrtc_offer', async (offer) => {
      if (!peerConnection) return;
      try {
        const offerCollision = makingOffer || peerConnection.signalingState !== 'stable';
        ignoreOffer = !isPolite && offerCollision;
        if (ignoreOffer) return;

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('webrtc_answer', { callId, answer });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socket.on('webrtc_answer', async (answer) => {
      if (!peerConnection) return;
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    });

    socket.on('webrtc_ice_candidate', async (candidate) => {
      if (!peerConnection) return;
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        if (!ignoreOffer) console.error('Error adding received ice candidate', e);
      }
    });

    // Clean up on unmount
    return () => {
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      peerConnection.close();
    };
  }, [socket, callId, role]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }
    } catch (e) {
      console.error('Error accessing media devices.', e);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  };

  const toggleVideo = async () => {
    if (role !== 'resident') return false;

    if (isVideoEnabled) {
      const videoTrack = localStream?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream?.removeTrack(videoTrack);
        const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender && peerConnectionRef.current) {
          peerConnectionRef.current.removeTrack(sender);
        }
      }
      setIsVideoEnabled(false);
      return false;
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (localStream) {
          localStream.addTrack(videoTrack);
        } else {
          setLocalStream(videoStream);
        }

        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(videoTrack, localStream!);
        }
        setIsVideoEnabled(true);
        return true;
      } catch (e) {
        console.error('Error accessing camera.', e);
        toast.error('Camera access denied or unavailable.');
        return false;
      }
    }
  };

  const switchCamera = async () => {
    if (!isVideoEnabled || role !== 'resident') return;
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: newFacingMode } });
      const newVideoTrack = videoStream.getVideoTracks()[0];
      
      const oldVideoTrack = localStream?.getVideoTracks()[0];
      if (oldVideoTrack) {
        oldVideoTrack.stop();
        localStream?.removeTrack(oldVideoTrack);
      }
      
      localStream?.addTrack(newVideoTrack);
      
      const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    } catch (e) {
      console.error('Error switching camera.', e);
      toast.error('Could not switch camera.');
    }
  };

  return { localStream, remoteStream, startCall, endCall, toggleMute, toggleVideo, switchCamera, isVideoEnabled, facingMode };
}
