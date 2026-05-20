'use client';

import { useParams, useRouter } from 'next/navigation';
import { IncomingCallScreen } from '../../../../../components/call/IncomingCallScreen';

export default function IncomingCallPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const callId = params.callId;

  return <IncomingCallScreen callId={callId} onExit={() => router.replace('/')} />;
}

