import dotenv from "dotenv";
dotenv.config();

export const env = {
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/recuro",
  SESSION_SECRET: process.env.SESSION_SECRET || "dev-secret",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  PORT: parseInt(process.env.PORT || "3001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GMAIL_EMAIL: process.env.GMAIL_EMAIL || "",
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
};
