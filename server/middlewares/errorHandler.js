export default function errorHandler(err, req, res, next) {
  console.error("API Error:", err?.response?.data || err?.message || err);
  res.status(500).json({ ok: false, error: err?.message || "internal error" });
}
