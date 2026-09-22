import mongoose, { Schema, Document } from "mongoose";

export interface IMagicLink extends Document {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const magicLinkSchema = new Schema<IMagicLink>(
  {
    email: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

magicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MagicLink = mongoose.model<IMagicLink>("MagicLink", magicLinkSchema);
