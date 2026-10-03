import { useCallback, useEffect, useState } from 'react';

// Compte à rebours en secondes (délai avant de pouvoir renvoyer un code).
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const restart = useCallback(() => setSeconds(initialSeconds), [initialSeconds]);
  return { seconds, restart };
}
