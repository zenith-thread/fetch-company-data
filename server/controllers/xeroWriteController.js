// controllers/xeroWriteController.js
import axios from "axios";
import { getDemoAuth } from "../models/demoStore.js";
import demoStore, { DEMO_USER_ID } from "../models/demoStore.js";
import { xero } from "../config/xeroClient.js";

/**
 * Helper: call Xero POST endpoint with tenant header
 * - On 401 it will attempt a single refresh using the demoStore saved tokenSet and retry once.
 * - If Xero returns an error payload (400/422/...), we throw that through so controllers can return it.
 */
async function postToXero(tokenSet, tenantId, endpointPath, body) {
  let triedRefresh = false;

  async function _doPost(currentTokenSet) {
    try {
      const resp = await axios.post(
        `https://api.xero.com/${endpointPath}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${currentTokenSet.access_token}`,
            "xero-tenant-id": tenantId,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );
      return resp.data;
    } catch (err) {
      const status = err?.response?.status;

      // If 401 -> try one refresh and retry
      if (status === 401 && !triedRefresh) {
        triedRefresh = true;
        try {
          const entry = demoStore[DEMO_USER_ID];
          if (!entry || !entry.tokenSet) {
            // no refresh token available
            throw err;
          }

          // let xero client know about current tokenSet and refresh
          await xero.setTokenSet(entry.tokenSet);
          const newTokenSet = await xero.refreshToken();

          // persist new tokens back to demoStore
          entry.tokenSet = newTokenSet;

          // retry with refreshed token
          return await _doPost(newTokenSet);
        } catch (refreshErr) {
          // If refresh fails, surface original or refresh error
          throw refreshErr || err;
        }
      }

      // For non-401 or after refresh attempt failed: rethrow the axios error object
      throw err;
    }
  }

  return _doPost(tokenSet);
}

/**
 * Format Xero error payloads for client responses.
 * If error comes from axios + Xero returned JSON body, return that to the client.
 */
function handleXeroError(err, res, next) {
  if (err?.response?.data) {
    // forward Xero's JSON error payload and status if present
    const status = err.response.status || 400;
    return res.status(status).json({ ok: false, error: err.response.data });
  }
  // else delegate to central error handler
  return next(err);
}

/* ------------------------
   Controllers (POST endpoints)
   ------------------------ */

export async function createContact(req, res, next) {
  try {
    const contactPayload = req.body;
    if (!contactPayload || !contactPayload.Name) {
      return res
        .status(400)
        .json({ ok: false, error: "Provide contact payload with Name" });
    }

    const { tokenSet, tenantId } = getDemoAuth();
    const body = { Contacts: [contactPayload] };

    const data = await postToXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Contacts",
      body
    );
    res.status(201).json({ ok: true, data });
  } catch (err) {
    return handleXeroError(err, res, next);
  }
}

export async function createInvoice(req, res, next) {
  try {
    let payload = req.body;
    if (!payload)
      return res
        .status(400)
        .json({ ok: false, error: "Missing invoice payload" });
    if (!payload.Invoices) payload = { Invoices: [payload] };

    const missing = payload.Invoices.find((inv) => !inv.Type || !inv.Contact);
    if (missing)
      return res
        .status(400)
        .json({ ok: false, error: "Each invoice needs Type and Contact" });

    const { tokenSet, tenantId } = getDemoAuth();
    const data = await postToXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices",
      payload
    );
    res.status(201).json({ ok: true, data });
  } catch (err) {
    return handleXeroError(err, res, next);
  }
}

/* Keep the small KPI POST handlers if you want them duplicated under /xero,
   or move them back to /kpi as you prefer. They do not call Xero. */

export async function cac(req, res, next) {
  try {
    const { acquisition_cost, new_customers } = { ...req.query, ...req.body };
    if (!acquisition_cost || !new_customers) {
      return res.status(400).json({
        ok: false,
        error: "Provide acquisition_cost and new_customers (body or query)",
      });
    }
    const cacVal = Number(acquisition_cost) / Number(new_customers);
    res.json({
      ok: true,
      acquisition_cost: Number(acquisition_cost),
      new_customers: Number(new_customers),
      cac: cacVal,
    });
  } catch (err) {
    next(err);
  }
}

export async function billableHours(req, res, next) {
  try {
    const { timeEntries } = req.body;
    if (!Array.isArray(timeEntries))
      return res
        .status(400)
        .json({ ok: false, error: "Send timeEntries array in body" });

    const totalBillable = timeEntries
      .filter((t) => t.billable)
      .reduce((s, t) => s + Number(t.hours || 0), 0);
    const monthly = {};
    for (const t of timeEntries) {
      const d = new Date(t.date);
      if (isNaN(d)) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      monthly[key] = monthly[key] || { totalHours: 0, billableHours: 0 };
      monthly[key].totalHours += Number(t.hours || 0);
      monthly[key].billableHours += t.billable ? Number(t.hours || 0) : 0;
    }
    res.json({ ok: true, totalBillableHours: totalBillable, monthly });
  } catch (err) {
    next(err);
  }
}
