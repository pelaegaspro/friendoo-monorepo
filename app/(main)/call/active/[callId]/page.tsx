'use client';

import { useParams, useRouter } from 'next/navigation';
import { ActiveCallScreen } from '../../../../../components/call/ActiveCallScreen';

export default function ActiveCallPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const callId = params.callId;

  return <ActiveCallScreen callId={callId} onExit={() => router.replace('/')} />;
}

