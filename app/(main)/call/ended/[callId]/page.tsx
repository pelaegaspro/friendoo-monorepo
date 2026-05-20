'use client';

import { useParams, useRouter } from 'next/navigation';
import { CallEndedScreen } from '../../../../../components/call/CallEndedScreen';

export default function CallEndedPage() {
  const params = useParams<{ callId: string }>();
  const router = useRouter();
  const callId = params.callId;

  return <CallEndedScreen callId={callId} onHome={() => router.replace('/')} />;
}

