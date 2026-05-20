import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgoraRTC, {
  type IAgoraRTCClient,
  type ILocalAudioTrack,
  type IRemoteAudioTrack,
  type UID,
} from 'agora-rtc-sdk-ng';
import { callService } from '../services/callService';

function hashUidToNumber(uid: string): number {
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0;
  // Agora UID must fit in 32-bit unsigned int
  return h;
}

export function useAgoraCall(args: {
  callId: string;
  firebaseUid: string;
}) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localTrackRef = useRef<ILocalAudioTrack | null>(null);
  const remoteTrackRef = useRef<IRemoteAudioTrack | null>(null);

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const join = useCallback(async () => {
    if (!args.callId || !args.firebaseUid) return;
    setError(null);
    setJoining(true);
    
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio' && user.audioTrack) {
          remoteTrackRef.current = user.audioTrack;
          user.audioTrack.play();
        }
      } catch (e) {
        console.error('Agora subscribe failed', e);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'audio') {
        if (remoteTrackRef.current) {
          remoteTrackRef.current.stop();
          remoteTrackRef.current = null;
        }
      }
    });

    client.on('token-privilege-will-expire', async () => {
      try {
        const { token: newToken } = await callService.getAgoraToken(args.callId);
        await client.renewToken(newToken);
      } catch (e) {
        console.error('Failed to renew token', e);
      }
    });

    try {
      const { token, appId, channel } = await callService.getAgoraToken(args.callId);
      
      const agoraUid: UID = hashUidToNumber(args.firebaseUid);
      await client.join(appId, channel, token, agoraUid);
      const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = localTrack;
      await client.publish([localTrack]);
      setJoined(true);
    } catch (e) {
      console.error('Agora join failed', e);
      setError(e instanceof Error ? e.message : 'Failed to join call');
      setJoined(false);
    } finally {
      setJoining(false);
    }
  }, [args.callId, args.firebaseUid]);

  const leave = useCallback(async () => {
    try {
      const client = clientRef.current;
      const localTrack = localTrackRef.current;

      if (localTrack) {
        localTrack.stop();
        localTrack.close();
        localTrackRef.current = null;
      }

      if (client) {
        await client.leave();
        client.removeAllListeners();
        clientRef.current = null;
      }
    } finally {
      setJoined(false);
      setJoining(false);
    }
  }, []);

  const setMute = useCallback(async (next: boolean) => {
    const localTrack = localTrackRef.current;
    if (!localTrack) {
      setMuted(next);
      return;
    }
    await localTrack.setEnabled(!next);
    setMuted(next);
  }, []);

  const toggleMute = useCallback(async () => {
    await setMute(!muted);
  }, [muted, setMute]);

  useEffect(() => {
    // auto-join on mount
    void join();
    return () => {
      void leave();
    };
  }, [join, leave]);

  return useMemo(
    () => ({
      joined,
      joining,
      muted,
      error,
      join,
      leave,
      toggleMute,
      setMute,
      setSpeakerOn: async (_on: boolean) => {
        // Web audio output routing is platform-dependent; keep state in store/UI.
      },
    }),
    [joined, joining, muted, error, join, leave, toggleMute, setMute]
  );
}
