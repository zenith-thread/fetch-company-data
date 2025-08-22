import { getDemoAuth } from "../models/demoStore.js";

export default function requireConnected(req, res, next) {
  try {
    getDemoAuth();
    next();
  } catch (err) {
    res.status(400).json({ ok: false, error: "Not connected to Xero" });
  }
}
