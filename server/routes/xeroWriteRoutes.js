// routes/xeroWriteRoutes.js
import express from "express";
import * as write from "../controllers/xeroWriteController.js";
const router = express.Router();

/**
 * Note: mounted under '/xero' in app.js (so full paths are e.g. POST /xero/contacts)
 */
router.post("/cac", write.cac);
router.post("/billable-hours", write.billableHours);
router.post("/contacts", write.createContact);
router.post("/invoices", write.createInvoice);

export default router;
