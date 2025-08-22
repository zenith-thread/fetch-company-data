import { xero } from "../config/xeroClient.js";
import axios from "axios";
import { saveDemoAuth } from "../models/demoStore.js";
import demoStore from "../models/demoStore.js";

export async function connect(req, res) {
  try {
    const consentUrl = await xero.buildConsentUrl();
    console.log("Consent URL:", consentUrl);

    // Usage: GET /xero/connect?raw=true
    if (
      req.query.raw === "true" ||
      req.headers.accept?.includes("application/json")
    ) {
      return res.json({ consentUrl });
    }

    // Default: redirect (browser flow)
    res.redirect(consentUrl);
  } catch (err) {
    console.error(
      "buildConsentUrl err:",
      err?.response?.data || err?.message || err
    );
    res.status(500).send("Failed to build Xero consent URL");
  }
}

// callback: must be mounted at the REDIRECT_URI pathname
export async function callback(req, res) {
  try {
    console.log("=== Callback hit ===", { url: req.url, query: req.query });
    if (req.query && req.query.error) {
      console.error("Xero returned error on callback:", req.query);
      return res
        .status(400)
        .send(`Xero returned an error: ${JSON.stringify(req.query)}`);
    }
    if (!req.query || !req.query.code) {
      console.error("No code param found in callback query:", req.query);
      return res
        .status(400)
        .send(
          `OAuth callback missing "code" param. Browser URL: ${req.originalUrl}`
        );
    }

    const fullCallbackUrl = `${req.protocol}://${req.get("host")}${
      req.originalUrl
    }`;
    const tokenSet = await xero.apiCallback(fullCallbackUrl);
    console.log("Raw tokenSet from Xero:", JSON.stringify(tokenSet, null, 2));
    if (!tokenSet?.access_token) {
      console.error(
        "Token exchange returned no access_token. tokenSet:",
        tokenSet
      );
      return res
        .status(500)
        .send("Token exchange failed: access_token is undefined.");
    }

    const connectionsResp = await axios.get(
      "https://api.xero.com/connections",
      {
        headers: { Authorization: `Bearer ${tokenSet.access_token}` },
      }
    );
    saveDemoAuth("ahmad", tokenSet, connectionsResp.data);
    console.log("Saved tokenSet and tenants for demo user:", "ahmad");
    res.send(
      "Xero connected — tokens saved in demoStore (in-memory). You can now call KPI endpoints."
    );
  } catch (err) {
    console.error("callback error (detailed):", {
      message: err?.message,
      responseData: err?.response?.data,
      stack: err?.stack?.split("\n").slice(0, 8).join("\n"),
    });
    res.status(500).send("Xero callback error - check server logs for details");
  }
}

export async function refresh(req, res) {
  try {
    const entry = demoStore["ahmad"];
    if (!entry || !entry.tokenSet) return res.status(400).send("No tokens");
    await xero.setTokenSet(entry.tokenSet);
    const newTokenSet = await xero.refreshToken();
    entry.tokenSet = newTokenSet;
    console.log("Refreshed tokenSet saved for demo user.");
    return res.json({ ok: true });
  } catch (err) {
    console.error(
      "refresh failed:",
      err?.response?.data || err?.message || err
    );
    res
      .status(500)
      .json({ ok: false, error: err?.message || "refresh failed" });
  }
}
