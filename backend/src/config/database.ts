import mongoose from "mongoose";

let connected = false;

export async function connectDB() {
  if (connected) return;
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    console.error("[database] MONGODB_URI is missing");
    throw new Error("MONGODB_URI is missing");
  }
  try {
    await mongoose.connect(uri);
    connected = true;
    console.log("[database] MongoDB connected");
  } catch (err) {
    console.error("[database] MongoDB connection failed:", err);
    throw err;
  }
}
