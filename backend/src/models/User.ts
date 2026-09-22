import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  avatar?: string;
  provider: "local" | "google" | "github";
  providerId?: string;
  passwordHash?: string;
  preferred_currency: string;
  email_notifications_enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    provider: { type: String, enum: ["local", "google", "github"], default: "local" },
    providerId: { type: String },
    passwordHash: { type: String },
    preferred_currency: { type: String, default: "NGN" },
    email_notifications_enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", userSchema);
