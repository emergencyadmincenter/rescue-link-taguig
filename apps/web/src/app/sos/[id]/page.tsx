import ConnectingScreen from '@/features/landing/components/ConnectingScreen';

export default async function SOSPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ConnectingScreen callId={resolvedParams.id} />;
}
