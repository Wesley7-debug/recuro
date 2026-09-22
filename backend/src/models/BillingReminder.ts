import mongoose, { Schema, Document } from "mongoose";

export interface IBillingReminder extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  billingDate: Date;
  reminderType: "7_days" | "3_days" | "1_day" | "trial_3_days" | "trial_1_days";
  sentAt: Date;
  createdAt: Date;
}

const billingReminderSchema = new Schema<IBillingReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
    billingDate: { type: Date, required: true },
    reminderType: {
      type: String,
      enum: ["7_days", "3_days", "1_day", "trial_3_days", "trial_1_days"],
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index: one reminder per subscription + billing date + type
billingReminderSchema.index(
  { subscriptionId: 1, billingDate: 1, reminderType: 1 },
  { unique: true },
);

export const BillingReminder = mongoose.model<IBillingReminder>(
  "BillingReminder",
  billingReminderSchema,
);
