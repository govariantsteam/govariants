// Keys for preferences we keep in the browser rather than on the user account.
// These are per-device by design: someone's answer on their phone may differ
// from their answer on desktop.
export const LOCAL_STORAGE_KEYS = {
  immediateSubmit: "govariants:immediate-submit",
} as const;
