import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { Session } from "./db";
import { storage } from "./storage";
import { userRoleEnum } from "@shared/schema";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "sheridan-jobs-secret", // Should be set in production
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
  role?: string,
) {
  const userRole = role || "job_seeker"; // Default to job_seeker if not specified
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: userRole as any,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    
    // Check if user already exists
    const claims = tokens.claims();
    const userId = claims?.sub;
    if (!userId) {
      throw new Error("User ID not found in token claims");
    }
    const existingUser = await storage.getUser(userId);
    
    if (existingUser) {
      // User exists, use existing role
      user.databaseUser = existingUser;
    } else {
      // New user, needs role selection
      user.isNewUser = true;
      
      // Create user with undefined role to indicate role selection needed
      await upsertUser(tokens.claims(), undefined);
    }
    
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // We can store the selected role in the session
    if (req.query.role) {
      (req.session as any).selectedRole = req.query.role;
    }
    
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};

// Role-based middleware
export const isBusinessUser: RequestHandler = async (req, res, next) => {
  await isAuthenticated(req, res, async () => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser || dbUser.role !== 'business') {
        return res.status(403).json({ message: "Access denied: Business account required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking business user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};

export const isJobSeeker: RequestHandler = async (req, res, next) => {
  await isAuthenticated(req, res, async () => {
    try {
      const user = req.user as any;
      const userId = user.claims.sub;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser || dbUser.role !== 'job_seeker') {
        return res.status(403).json({ message: "Access denied: Job seeker account required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking job seeker user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
};