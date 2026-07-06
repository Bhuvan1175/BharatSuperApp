import {useEffect, useState} from 'react';

/** Cycles through a list of strings — used for the rotating search placeholder. */
export function useRotatingText(items: string[], intervalMs = 2800): string {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs]);
  return items[index] ?? '';
}
