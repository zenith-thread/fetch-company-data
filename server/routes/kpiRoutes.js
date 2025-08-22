// routes/kpiRoutes.js
import express from "express";
import * as kpi from "../controllers/kpiController.js";
const router = express.Router();

router.get("/revenue-by-customer-month", kpi.revenueByCustomerMonth);
router.get("/gross-profit-margin", kpi.grossProfitMargin);
router.get("/net-profit-margin", kpi.netProfitMargin);
router.get("/avg-rev-per-client", kpi.avgRevPerClient);
router.get("/ltv", kpi.ltv);
router.get("/staff-to-client", kpi.staffToClient);
router.get("/revenue-growth", kpi.revenueGrowth);
router.get("/churn", kpi.churn);
router.get("/total-customers", kpi.totalCustomers);
router.get("/lost-customers", kpi.lostCustomers);
router.get("/revenue-ytd-compare", kpi.revenueYtdCompare);
router.get("/expenses-ytd-compare", kpi.expensesYtdCompare);
router.get("/software-costs-percent", kpi.softwareCostsPercent);

// debug (keeps the /kpi/debug route)
router.get("/debug", kpi.debug);

export default router;
