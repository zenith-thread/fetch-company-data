// Simple in-memory store. Replace with a DB for production.
export const DEMO_USER_ID = "ahmad";
const demoStore = {}; // { userId: { tokenSet, tenants } }

export function saveDemoAuth(userId, tokenSet, tenants) {
  demoStore[userId] = demoStore[userId] || {};
  demoStore[userId].tokenSet = tokenSet;
  demoStore[userId].tenants = tenants;
}

export function getDemoAuth(userId = DEMO_USER_ID) {
  const entry = demoStore[userId];
  if (!entry || !entry.tokenSet || !entry.tenants?.length)
    throw new Error("Not connected");
  return { tokenSet: entry.tokenSet, tenantId: entry.tenants[0].tenantId };
}

export function getDemoStoreSummary() {
  const entry = demoStore[DEMO_USER_ID];
  return {
    hasDemo: !!entry,
    tenants: entry?.tenants || null,
    tokenExpiry: entry?.tokenSet?.expires_at || null,
    tokenSample: entry?.tokenSet
      ? {
          access_token_present: !!entry.tokenSet.access_token,
          refresh_token_present: !!entry.tokenSet.refresh_token,
        }
      : null,
  };
}

export default demoStore;
