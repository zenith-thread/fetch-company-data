import fs from "fs";
import https from "https";
import http from "http";
import app from "./app.js";
import "dotenv/config";

const PORT = process.env.PORT || 4000;

try {
  const key = fs.readFileSync("key.pem");
  const cert = fs.readFileSync("cert.pem");
  https
    .createServer({ key, cert }, app)
    .listen(PORT, () =>
      console.log(`Go to https://localhost:${PORT}/xero/connect`)
    );
} catch (err) {
  console.warn("HTTPS certs not found or invalid — falling back to HTTP.");
  http
    .createServer(app)
    .listen(PORT, () =>
      console.log(`Listening (HTTP) on http://localhost:${PORT}`)
    );
}
