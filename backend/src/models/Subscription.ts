import mongoose, { Schema, Document } from "mongoose";

export interface PriceHistoryEntry {
  amount: number;
  currency: string;
  date: Date;
  source: "initial" | "manual" | "statement";
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  provider: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  nextBillingDate: Date;
  status: "active" | "cancelled" | "paused" | "trial";
  trialEndDate?: Date | null;
  priceHistory: PriceHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const priceHistorySchema = new Schema(
  {
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    date: { type: Date, required: true },
    source: { type: String, enum: ["initial", "manual", "statement"], required: true },
  },
  { _id: false },
);

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    provider: { type: String, required: true },
    category: { type: String, default: "other" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    billingCycle: { type: String, enum: ["weekly", "monthly", "quarterly", "yearly"], required: true },
    nextBillingDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "cancelled", "paused", "trial"], default: "active" },
    trialEndDate: { type: Date, default: null },
    priceHistory: { type: [priceHistorySchema], default: [] },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
