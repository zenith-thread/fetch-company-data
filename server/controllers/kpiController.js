import { getDemoAuth, getDemoStoreSummary } from "../models/demoStore.js";
import { fetchAllFromXero, filterByDateRange } from "../utils/xeroHelpers.js";

// Revenue by customer each month
export async function revenueByCustomerMonth(req, res, next) {
  try {
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices",
      {}
    );
    const agg = {};
    for (const inv of invoices.filter((i) => i.Type === "ACCREC")) {
      const contactName = inv.Contact?.Name || "Unknown";
      const d = new Date(inv.Date);
      if (isNaN(d)) continue;
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const amount = Number(inv.Total || 0);
      agg[contactName] = agg[contactName] || {};
      agg[contactName][monthKey] = (agg[contactName][monthKey] || 0) + amount;
    }
    res.json({ ok: true, data: agg, invoiceCount: invoices.length });
  } catch (err) {
    next(err);
  }
}

// Gross profit margin
export async function grossProfitMargin(req, res, next) {
  try {
    const { start, end } = req.query;
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCREC"),
      "Date",
      start,
      end
    );
    const bills = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCPAY"),
      "Date",
      start,
      end
    );
    const revenue = sales.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const costs = bills.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const grossProfit = revenue - costs;
    const margin = revenue ? grossProfit / revenue : null;
    res.json({
      ok: true,
      revenue,
      costs,
      grossProfit,
      grossProfitMargin: margin,
    });
  } catch (err) {
    next(err);
  }
}

// Net profit margin
export async function netProfitMargin(req, res, next) {
  try {
    const { start, end } = req.query;
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCREC"),
      "Date",
      start,
      end
    );
    const bills = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCPAY"),
      "Date",
      start,
      end
    );
    const revenue = sales.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const expenses = bills.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const netProfit = revenue - expenses;
    const margin = revenue ? netProfit / revenue : null;
    res.json({
      ok: true,
      revenue,
      expenses,
      netProfit,
      netProfitMargin: margin,
    });
  } catch (err) {
    next(err);
  }
}

// Avg rev per client
export async function avgRevPerClient(req, res, next) {
  try {
    const { start, end } = req.query;
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCREC"),
      "Date",
      start,
      end
    );
    const revenue = sales.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const unique = new Set(
      sales.map((i) => i.Contact?.ContactID || i.Contact?.Name)
    );
    const clientCount = unique.size || 0;
    const avg = clientCount ? revenue / clientCount : 0;
    res.json({ ok: true, revenue, clientCount, avgRevenuePerClient: avg });
  } catch (err) {
    next(err);
  }
}

// LTV
export async function ltv(req, res, next) {
  try {
    const { start, end, avg_lifespan_months = 36 } = req.query;
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCREC"),
      "Date",
      start,
      end
    );
    const revenue = sales.reduce((s, inv) => s + Number(inv.Total || 0), 0);
    const unique = new Set(
      sales.map((i) => i.Contact?.ContactID || i.Contact?.Name)
    );
    const clientCount = unique.size || 0;
    const monthsInRange =
      start && end
        ? Math.max(
            1,
            (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24 * 30)
          )
        : 1;
    const avgMonthlyRevenuePerClient = clientCount
      ? revenue / clientCount / monthsInRange
      : 0;
    const ltvPerClient =
      avgMonthlyRevenuePerClient * Number(avg_lifespan_months);
    res.json({
      ok: true,
      revenue,
      clientCount,
      avgMonthlyRevenuePerClient,
      avg_lifespan_months: Number(avg_lifespan_months),
      ltvPerClient,
    });
  } catch (err) {
    next(err);
  }
}

// Staff to client
export async function staffToClient(req, res, next) {
  try {
    const staff_count = Number(
      req.query.staff_count || req.body?.staff_count || 0
    );
    if (!staff_count)
      return res
        .status(400)
        .json({ ok: false, error: "Provide staff_count in query or body" });
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const clientCount = new Set(
      sales.map((i) => i.Contact?.ContactID || i.Contact?.Name)
    ).size;
    const ratio = clientCount ? staff_count / clientCount : null;
    res.json({
      ok: true,
      staff_count,
      clientCount,
      staff_to_client_ratio: ratio,
    });
  } catch (err) {
    next(err);
  }
}

// Revenue growth
export async function revenueGrowth(req, res, next) {
  try {
    const { currentStart, currentEnd, prevStart, prevEnd } = req.query;
    if (!currentStart || !currentEnd || !prevStart || !prevEnd) {
      return res.status(400).json({
        ok: false,
        error: "Provide currentStart,currentEnd,prevStart,prevEnd as ISO dates",
      });
    }
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const currentRevenue = filterByDateRange(
      sales,
      "Date",
      currentStart,
      currentEnd
    ).reduce((s, i) => s + Number(i.Total || 0), 0);
    const prevRevenue = filterByDateRange(
      sales,
      "Date",
      prevStart,
      prevEnd
    ).reduce((s, i) => s + Number(i.Total || 0), 0);
    const growthRate = prevRevenue
      ? (currentRevenue - prevRevenue) / prevRevenue
      : null;
    res.json({ ok: true, currentRevenue, prevRevenue, growthRate });
  } catch (err) {
    next(err);
  }
}

// Churn
export async function churn(req, res, next) {
  try {
    const { prevStart, prevEnd, currentStart, currentEnd } = req.query;
    if (!prevStart || !prevEnd || !currentStart || !currentEnd)
      return res.status(400).json({
        ok: false,
        error: "Provide prevStart,prevEnd,currentStart,currentEnd ISO dates",
      });
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const prevClients = new Set(
      filterByDateRange(sales, "Date", prevStart, prevEnd).map(
        (i) => i.Contact?.ContactID || i.Contact?.Name
      )
    );
    const currentClients = new Set(
      filterByDateRange(sales, "Date", currentStart, currentEnd).map(
        (i) => i.Contact?.ContactID || i.Contact?.Name
      )
    );
    const lost = [...prevClients].filter((id) => !currentClients.has(id));
    const churnRate = prevClients.size ? lost.length / prevClients.size : null;
    res.json({
      ok: true,
      prevClients: prevClients.size,
      currentClients: currentClients.size,
      lostCustomers: lost.length,
      churnRate,
    });
  } catch (err) {
    next(err);
  }
}

// Total customers
export async function totalCustomers(req, res, next) {
  try {
    const { tokenSet, tenantId } = getDemoAuth();
    const contacts = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Contacts"
    );
    res.json({ ok: true, totalCustomers: contacts.length });
  } catch (err) {
    next(err);
  }
}

// Lost customers
export async function lostCustomers(req, res, next) {
  try {
    const { prevStart, prevEnd, currentStart, currentEnd } = req.query;
    if (!prevStart || !prevEnd || !currentStart || !currentEnd)
      return res.status(400).json({
        ok: false,
        error: "Provide prevStart,prevEnd,currentStart,currentEnd ISO dates",
      });
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const prevClients = new Set(
      filterByDateRange(sales, "Date", prevStart, prevEnd).map(
        (i) => i.Contact?.ContactID || i.Contact?.Name
      )
    );
    const currentClients = new Set(
      filterByDateRange(sales, "Date", currentStart, currentEnd).map(
        (i) => i.Contact?.ContactID || i.Contact?.Name
      )
    );
    const lost = [...prevClients].filter((id) => !currentClients.has(id));
    res.json({
      ok: true,
      lostCustomersCount: lost.length,
      lostCustomers: lost.slice(0, 100),
    });
  } catch (err) {
    next(err);
  }
}

// Revenue YTD compare
export async function revenueYtdCompare(req, res, next) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const ytdStart = `${year}-01-01`;
    const ytdEnd = now.toISOString().split("T")[0];
    const prevYtdStart = `${year - 1}-01-01`;
    const prevYtdEnd = `${year - 1}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const current = filterByDateRange(sales, "Date", ytdStart, ytdEnd).reduce(
      (s, i) => s + Number(i.Total || 0),
      0
    );
    const prev = filterByDateRange(
      sales,
      "Date",
      prevYtdStart,
      prevYtdEnd
    ).reduce((s, i) => s + Number(i.Total || 0), 0);
    const pctChange = prev ? (current - prev) / prev : null;
    res.json({
      ok: true,
      currentYTD: current,
      prevYTD: prev,
      percentChange: pctChange,
    });
  } catch (err) {
    next(err);
  }
}

// Expenses YTD compare
export async function expensesYtdCompare(req, res, next) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const ytdStart = `${year}-01-01`;
    const ytdEnd = now.toISOString().split("T")[0];
    const prevYtdStart = `${year - 1}-01-01`;
    const prevYtdEnd = `${year - 1}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const bills = invoices.filter((i) => i.Type === "ACCPAY");
    const current = filterByDateRange(bills, "Date", ytdStart, ytdEnd).reduce(
      (s, i) => s + Number(i.Total || 0),
      0
    );
    const prev = filterByDateRange(
      bills,
      "Date",
      prevYtdStart,
      prevYtdEnd
    ).reduce((s, i) => s + Number(i.Total || 0), 0);
    const pctChange = prev ? (current - prev) / prev : null;
    res.json({
      ok: true,
      currentYTDExpenses: current,
      prevYTDExpenses: prev,
      percentChange: pctChange,
    });
  } catch (err) {
    next(err);
  }
}

// Software costs / % of revenue
export async function softwareCostsPercent(req, res, next) {
  try {
    const { start, end, search = "software" } = req.query;
    const { tokenSet, tenantId } = getDemoAuth();
    const invoices = await fetchAllFromXero(
      tokenSet,
      tenantId,
      "api.xro/2.0/Invoices"
    );
    const bills = filterByDateRange(
      invoices.filter((i) => i.Type === "ACCPAY"),
      "Date",
      start,
      end
    );
    let softwareTotal = 0;
    for (const b of bills) {
      const contact = (b.Contact?.Name || "").toLowerCase();
      if (contact.includes(search.toLowerCase())) {
        softwareTotal += Number(b.Total || 0);
        continue;
      }
      if (Array.isArray(b.LineItems)) {
        for (const li of b.LineItems) {
          if (
            (li.Description || "").toLowerCase().includes(search.toLowerCase())
          ) {
            softwareTotal += Number(b.Total || 0);
            break;
          }
        }
      }
    }
    const sales = invoices.filter((i) => i.Type === "ACCREC");
    const revenue = filterByDateRange(sales, "Date", start, end).reduce(
      (s, i) => s + Number(i.Total || 0),
      0
    );
    const percentOfRevenue = revenue ? softwareTotal / revenue : null;
    res.json({ ok: true, softwareTotal, revenue, percentOfRevenue });
  } catch (err) {
    next(err);
  }
}

// debug
export async function debug(req, res) {
  res.json({ demoStoreSummary: getDemoStoreSummary() });
}
