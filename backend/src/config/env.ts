import dotenv from "dotenv";
dotenv.config();

function sanitizeFrontendUrl(raw: string): string {
  // Strip quotes, brackets, whitespace, newlines and trailing slash that cause "Invalid character in header"
  let v = raw.trim();
  // Remove surrounding [" ' ] if user pasted JSON array or quoted string: ["https://..."] or "https://..."
  v = v.replace(/^[\s"'\[\]]+|[\s"'\[\]]+$/g, "");
  // Remove any internal quotes/brackets/newlines and whitespace
  v = v.replace(/["'\[\]\r\n]/g, "").trim();
  // Take first URL if comma-separated list was pasted
  if (v.includes(",")) v = v.split(",")[0]!.trim();
  // Remove trailing slash for origin comparison
  v = v.replace(/\/+$/, "");
  return v || "http://localhost:5173";
}

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/recuro",
  SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret",
  FRONTEND_URL: sanitizeFrontendUrl(process.env.FRONTEND_URL || "http://localhost:5173"),
  BACKEND_URL: (process.env.BACKEND_URL || "http://localhost:3001").trim().replace(/\/+$/, ""),
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GMAIL_EMAIL: process.env.GMAIL_EMAIL || "",
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
};
