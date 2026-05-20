'use client';

import { useParams, useRouter } from 'next/navigation';
import { OutgoingCallScreen } from '../../../../../components/call/OutgoingCallScreen';

export default function OutgoingCallPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const callId = params.callId;

  return <OutgoingCallScreen callId={callId} onExit={() => router.replace('/')} />;
}

