import {useCallback, useEffect, useRef, useState} from 'react';

/** Reusable countdown timer (OTP resend, SOS). */
export function useCountdown(seconds: number): {
  remaining: number;
  running: boolean;
  start: () => void;
  stop: () => void;
} {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    stop();
    setRemaining(seconds);
    setRunning(true);
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (ref.current) clearInterval(ref.current);
          ref.current = null;
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, stop]);

  useEffect(() => () => stop(), [stop]);

  return {remaining, running, start, stop};
}
