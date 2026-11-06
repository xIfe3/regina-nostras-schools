import SystemSettings, { ISystemSettings } from "../models/SystemSettings";

let cache: { value: ISystemSettings; at: number } | null = null;
const TTL_MS = 15_000;

/** Load (or create) the single settings document. Cached briefly because auth checks it on every request. */
export const getSettings = async (): Promise<ISystemSettings> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let doc = await SystemSettings.findOne({ key: "global" });
  if (!doc) {
    try {
      doc = await SystemSettings.create({ key: "global" });
    } catch {
      // Another request created it at the same moment
      doc = await SystemSettings.findOne({ key: "global" });
    }
  }
  cache = { value: doc!, at: Date.now() };
  return doc!;
};

export const clearSettingsCache = () => {
  cache = null;
};

export interface AccessDenied {
  code: "MAINTENANCE" | "LOGIN_DISABLED";
  message: string;
}

/**
 * Is this role currently allowed into the portal? Admins are never blocked,
 * so they can always log in to switch maintenance off again.
 */
export const checkPortalAccess = async (role: string): Promise<AccessDenied | null> => {
  if (role === "admin") return null;
  const { access } = await getSettings();

  if (access.maintenanceMode) {
    return { code: "MAINTENANCE", message: access.maintenanceMessage };
  }
  if (role === "student" && !access.studentLoginEnabled) {
    return { code: "LOGIN_DISABLED", message: access.loginDisabledMessage };
  }
  if (role === "parent" && !access.parentLoginEnabled) {
    return { code: "LOGIN_DISABLED", message: access.loginDisabledMessage };
  }
  return null;
};
