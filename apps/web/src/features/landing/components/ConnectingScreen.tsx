"use client";

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket';
import { FiLoader, FiPhoneCall, FiAlertCircle } from 'react-icons/fi';
import ActiveSOSView from './ActiveSOSView';
import ActiveSOSChatView from './ActiveSOSChatView';

export default function ConnectingScreen({ callId }: { callId: string }) {
  const { socket, isConnected } = useSocket();
  const [status, setStatus] = useState<'connecting' | 'ringing' | 'accepted' | 'timeout' | 'missed' | 'rejected'>('connecting');
  const [statusMessage, setStatusMessage] = useState('Connecting to Command Center...');
  const [activeCallData, setActiveCallData] = useState<any>(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('join_call_room', callId);

    const onRoutingStatus = (data: any) => {
      setStatus(data.status); // 'ringing'
      setStatusMessage(data.message);
    };

    const onCallAccepted = (data: any) => {
      setStatus('accepted');
      setActiveCallData(data);
    };

    const onRoutingTimeout = (data: any) => {
      setStatus('timeout');
      setStatusMessage(data.message);
    };

    const onCallMissed = (data: any) => {
      setStatus('missed');
      setStatusMessage(data.message || 'No coordinators were available to answer your call.');
    };

    const onCallRejected = (data: any) => {
      setStatus('rejected');
      setStatusMessage(data.reason || 'The request was rejected by the coordinator.');
    };

    socket.on('routing_status', onRoutingStatus);
    socket.on('call_accepted', onCallAccepted);
    socket.on('routing_timeout', onRoutingTimeout);
    socket.on('call_missed', onCallMissed);
    socket.on('call_rejected', onCallRejected);

    return () => {
      socket.off('routing_status', onRoutingStatus);
      socket.off('call_accepted', onCallAccepted);
      socket.off('routing_timeout', onRoutingTimeout);
      socket.off('call_missed', onCallMissed);
      socket.off('call_rejected', onCallRejected);
    };
  }, [socket, isConnected, callId]);

  if (status === 'accepted' && activeCallData) {
    if (activeCallData.communicationMethod === 'chat') {
      return <ActiveSOSChatView callId={callId} callData={activeCallData} socket={socket!} />;
    }
    return <ActiveSOSView callId={callId} callData={activeCallData} socket={socket!} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-xl w-[90vw] md:w-[600px] flex flex-col items-center text-center">
        
        {status === 'timeout' || status === 'missed' || status === 'rejected' ? (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiAlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="title-medium text-gray-900 mb-2">
              {status === 'rejected' ? 'Request Rejected' : 'Request Missed'}
            </h1>
            <p className="body-medium text-gray-500 mb-8">{statusMessage}</p>
            
            <button className="w-full py-3 bg-danger text-white rounded-xl font-medium hover:bg-danger-hover transition-colors mb-3">
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </>
        ) : (
          <>
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-danger/10 rounded-full flex items-center justify-center relative z-10">
                {status === 'ringing' ? (
                  <FiPhoneCall className="w-10 h-10 text-danger animate-pulse" />
                ) : (
                  <FiLoader className="w-10 h-10 text-danger animate-spin" />
                )}
              </div>
              <div className="absolute inset-0 bg-danger/5 rounded-full animate-ping z-0"></div>
            </div>
            
            <h1 className="title-medium text-gray-900 mb-2">
              {status === 'ringing' ? 'Finding an available coordinator...' : 'Connecting...'}
            </h1>
            <p className="body-medium text-gray-500">
              {statusMessage}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-8 overflow-hidden">
              <div className="bg-danger h-full rounded-full w-2/3 animate-pulse"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
