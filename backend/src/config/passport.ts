import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";
import { env } from "./env";

function getCallbackURL(path: string) {
  const base = (env.BACKEND_URL || "http://localhost:3001").trim().replace(/\/+$/, "");
  return `${base}${path}`;
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: getCallbackURL("/api/auth/google/callback"),
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || "";
          let user = await User.findOne({ provider: "google", providerId: profile.id });
          if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
              user.provider = "google";
              user.providerId = profile.id;
              user.avatar = user.avatar || profile.photos?.[0]?.value;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              name: profile.displayName,
              email,
              avatar: profile.photos?.[0]?.value,
              provider: "google",
              providerId: profile.id,
            });
          }
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
