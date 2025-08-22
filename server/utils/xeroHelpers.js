import axios from "axios";
import { xero } from "../config/xeroClient.js";
import demoStore, { DEMO_USER_ID } from "../models/demoStore.js";

// Generic paged fetch with single-refresh logic
export async function fetchAllFromXero(
  tokenSet,
  tenantId,
  endpointPath,
  params = {}
) {
  const results = [];
  let page = 1;
  let triedRefresh = false;

  async function requestPage(pageNumber) {
    try {
      const resp = await axios.get(`https://api.xero.com/${endpointPath}`, {
        headers: {
          Authorization: `Bearer ${tokenSet.access_token}`,
          "xero-tenant-id": tenantId,
          Accept: "application/json",
        },
        params: { ...params, page: pageNumber },
      });
      return resp;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 && !triedRefresh) {
        triedRefresh = true;
        try {
          const entry = demoStore[DEMO_USER_ID];
          if (!entry || !entry.tokenSet)
            throw new Error("No tokenSet to refresh");
          await xero.setTokenSet(entry.tokenSet);
          const newTokenSet = await xero.refreshToken();
          entry.tokenSet = newTokenSet;
          tokenSet = newTokenSet;
          const retryResp = await axios.get(
            `https://api.xero.com/${endpointPath}`,
            {
              headers: {
                Authorization: `Bearer ${tokenSet.access_token}`,
                "xero-tenant-id": tenantId,
                Accept: "application/json",
              },
              params: { ...params, page: pageNumber },
            }
          );
          return retryResp;
        } catch (refreshErr) {
          console.error(
            "Token refresh failed:",
            refreshErr?.response?.data || refreshErr?.message || refreshErr
          );
          throw refreshErr;
        }
      }
      throw err;
    }
  }

  while (true) {
    const resp = await requestPage(page);
    const data = resp.data;
    const key = Object.keys(data).find((k) => Array.isArray(data[k]));
    if (!key) break;
    const arr = data[key];
    if (!arr || !arr.length) break;
    results.push(...arr);
    if (arr.length < 100) break; // Xero's page sizing heuristic
    page += 1;
  }

  return results;
}

export function filterByDateRange(items, dateField = "Date", startIso, endIso) {
  if (!startIso && !endIso) return items;
  const start = startIso ? new Date(startIso) : null;
  const end = endIso ? new Date(endIso) : null;
  return items.filter((it) => {
    const d = new Date(it[dateField] || it.Date || it.DueDate);
    if (isNaN(d)) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}
