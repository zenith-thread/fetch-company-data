import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import kpiRoutes from "./routes/kpiRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import xeroWriteRoutes from "./routes/xeroWriteRoutes.js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// mount routes
app.use("/xero", authRoutes);
app.use("/xero", xeroWriteRoutes);
app.use("/kpi", kpiRoutes);

app.get("/debug", (req, res) => {
  res.redirect("/kpi/debug");
});

// handle callback path derived from REDIRECT_URI (so route matches whatever REDIRECT_URI path is)
try {
  const parsed = new URL(process.env.REDIRECT_URI);
  const callbackPath = parsed.pathname || "/";
  // ensure we respond to GET on the exact redirect path as well (use a tiny handler that forwards to authController.callback)
  import("./controllers/authController.js").then((mod) => {
    app.get(callbackPath, mod.callback);
    console.log(`Registered callback handler at ${callbackPath}`);
  });
} catch (e) {
  console.warn(
    "Invalid REDIRECT_URI in env; callback route not auto-registered."
  );
}

// health
app.get("/health", (req, res) => res.json({ ok: true }));

// centralized error handler
app.use(errorHandler);

export default app;
