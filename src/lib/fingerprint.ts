import FingerprintJS from "@fingerprintjs/fingerprintjs";

let fpPromise: Promise<any> | null = null;

export const initFingerprint = async () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

export const getDeviceFingerprint = async (): Promise<string> => {
  try {
    const fp = await initFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Failed to get device fingerprint:", error);
    return "error-fallback";
  }
};

export const getClientIP = async (): Promise<string> => {
  try {
    // In production, this would be handled by an Edge Function
    // For now, we return a placeholder that will be replaced server-side
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "0.0.0.0";
  } catch (error) {
    console.error("Failed to get IP address:", error);
    return "0.0.0.0";
  }
};
