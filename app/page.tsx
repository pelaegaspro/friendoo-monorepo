'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // Check session or let middleware handle it via redirect
      // Since we are on the client, we can redirect to login or discover
      // But the most reliable way is to let the app state decide.
      // For now, redirect to login; the middleware will intercept and send to discover if logged in.
      router.replace('/login');
    };

    video.addEventListener('ended', handleEnded);
    video.play().catch(() => {
      router.replace('/login');
    });

    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 5000);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/splash.mp4"
        className="w-full h-full object-contain"
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
    };

    video.addEventListener('ended', handleEnded);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Video started successfully
        })
        .catch(() => {
          // Auto-play blocked; decide based on auth state immediately
          const session = document.cookie
            .split('; ')
            .find((row) => row.startsWith('session='))
            ?.split('=')[1];
          const onboardingComplete = document.cookie
            .split('; ')
            .find((row) => row.startsWith('onboardingComplete='))
            ?.split('=')[1] === 'true';

          if (!session) {
            router.replace('/login');
          } else if (!onboardingComplete) {
            router.replace('/onboarding');
          } else {
            router.replace('/discover');
          }
        });
    }

    // Fallback: redirect after 5s even if video doesn't end
    const timeout = setTimeout(() => {
      video.removeEventListener('ended', handleEnded);
      const session = document.cookie
        .split('; ')
        .find((row) => row.startsWith('session='))
        ?.split('=')[1];
      const onboardingComplete = document.cookie
        .split('; ')
        .find((row) => row.startsWith('onboardingComplete='))
        ?.split('=')[1] === 'true';

      if (!session) {
        router.replace('/login');
      } else if (!onboardingComplete) {
        router.replace('/onboarding');
      } else {
        router.replace('/discover');
      }
    }, 5000);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        src="/splash.mp4"
        className="w-full h-full object-contain"
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
