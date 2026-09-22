import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { IUser } from "../models/User";

const JWT_EXPIRES_IN = "30d";

function getJwtSecret() {
  return process.env.JWT_SECRET || env.SESSION_SECRET;
}

export function signAuthToken(user: IUser) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & { sub?: string };
}
