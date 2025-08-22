import { XeroClient } from "xero-node";
import "dotenv/config";

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Set CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI in .env");
  process.exit(1);
}

export const xero = new XeroClient({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUris: [REDIRECT_URI],
  scopes: [
    "openid",
    "profile",
    "email",
    "offline_access",
    "accounting.transactions",
    "accounting.reports.read",
    "accounting.settings",
    "accounting.contacts.read",
    "accounting.contacts",
  ],
});

export default xero;
