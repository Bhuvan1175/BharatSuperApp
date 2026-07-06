/** Small formatting helpers used across screens. */
export const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

export const formatPrice = (n: number): string =>
  `₹${n.toLocaleString('en-IN')}`;

export const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
};

export const interpolate = (
  template: string,
  vars: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);
