import mongoose, { Schema, Document } from "mongoose";

export interface ISavingsLog extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  currency: string;
  status: "cancelled" | "paused";
  date: Date;
  createdAt: Date;
}

const savingsLogSchema = new Schema<ISavingsLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ["cancelled", "paused"], required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const SavingsLog = mongoose.model<ISavingsLog>("SavingsLog", savingsLogSchema);
