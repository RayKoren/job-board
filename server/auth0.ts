import { auth } from 'express-openid-connect';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Auth0 configuration setup
export function setupAuth(app: Express) {
  // Configuration object
  // Get the Replit domain dynamically
  const getBaseUrl = () => {
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    
    if (process.env.REPLIT_SLUG) {
      return `https://${process.env.REPLIT_SLUG}.${process.env.REPLIT_OWNER}.repl.co`;
    }
    
    return 'http://localhost:5000';
  };

  // Ensure issuerBaseURL is a valid URL with https:// protocol
  let issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL || '';
  if (issuerBaseURL && !issuerBaseURL.startsWith('https://')) {
    issuerBaseURL = 'https://' + issuerBaseURL;
    console.log('Added https:// protocol to issuerBaseURL:', issuerBaseURL);
  }

  // Get the base URL for the application
  const baseURL = getBaseUrl();
  const callbackURL = `${baseURL}/callback`;
  
  // Log auth config for debugging
  console.log('Auth0 Configuration:');
  console.log('- baseURL:', baseURL);
  console.log('- callbackURL:', callbackURL);
  console.log('- clientID:', process.env.AUTH0_CLIENT_ID ? '[PROVIDED]' : '[MISSING]');
  console.log('- issuerBaseURL:', issuerBaseURL || '[MISSING]');
  console.log('- clientSecret:', process.env.AUTH0_CLIENT_SECRET ? '[PROVIDED]' : '[MISSING]');
  
  const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SESSION_SECRET || 'a-long-random-string',
    baseURL: baseURL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: issuerBaseURL || 'https://example.auth0.com',
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    routes: {
      callback: '/callback', // Auth0 will redirect here after login
      login: '/login',       // Auth0 login route (will be accessed via /api/login)
      logout: '/logout'      // Auth0 logout route (will be accessed via /api/logout)
    },
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
      // No need to set redirect_uri as it's automatically derived from baseURL + routes.callback
    },
  };

  // Initialize auth router
  app.use(auth(config));
  
  // Add custom login route for API compatibility
  app.get('/api/login', (req, res) => {
    console.log("Handling /api/login request, redirecting to Auth0");
    res.oidc.login({
      returnTo: '/',
      // Use the Auth0 UI for login
      authorizationParams: {
        response_type: 'code',
        prompt: 'login'
      }
    });
  });
  
  // Add custom logout route for API compatibility
  app.get('/api/logout', (req, res) => {
    console.log("Handling /api/logout request");
    res.oidc.logout({ 
      returnTo: '/',
      // Make sure we fully log out
      logoutParams: {
        federated: 'true' 
      }
    });
  });

  // Handle profile route - this is where users are redirected after login
  app.get('/callback', async (req: Request, res: Response) => {
    // After successful login, redirect to role selection if user doesn't have a role
    if (req.oidc.isAuthenticated()) {
      const user = req.oidc.user;
      if (!user) {
        return res.redirect('/');
      }

      try {
        console.log("Auth callback for user:", user.email);
        
        // Try to find user in database
        const userId = user.sub;
        const dbUser = await storage.getUserByEmail(user.email);
        
        // If user doesn't exist, create a new one
        if (!dbUser) {
          console.log("Creating new user:", user.email);
          try {
            await storage.upsertUser({
              id: userId,
              email: user.email,
              firstName: user.given_name || null,
              lastName: user.family_name || null,
              profileImageUrl: user.picture || null,
              role: null // Start with no role
            });
          } catch (err) {
            console.error("Error creating user:", err);
          }
          
          // Redirect to role selection
          return res.redirect('/select-role');
        }
        
        // If user exists but doesn't have a role, redirect to role selection
        if (!dbUser.role) {
          console.log("User has no role, redirecting to selection:", user.email);
          return res.redirect('/select-role');
        }
        
        console.log("User authenticated with role:", dbUser.role);
        
        // Otherwise, redirect to home
        return res.redirect('/');
      } catch (error) {
        console.error("Error in auth callback:", error);
        return res.redirect('/');
      }
    }
    
    // If not authenticated, redirect to home
    res.redirect('/');
  });

  // User profile endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    if (req.oidc.isAuthenticated() && req.oidc.user) {
      try {
        const userId = req.oidc.user.sub;
        let dbUser = await storage.getUserByEmail(req.oidc.user.email);
        
        if (!dbUser) {
          // Create user if doesn't exist (but shouldn't happen normally)
          dbUser = await storage.upsertUser({
            id: userId,
            email: req.oidc.user.email,
            firstName: req.oidc.user.given_name || null,
            lastName: req.oidc.user.family_name || null,
            profileImageUrl: req.oidc.user.picture || null,
            role: null
          });
        }
        
        // Get profile data based on role
        let profile = null;
        if (dbUser.role === 'business') {
          profile = await storage.getBusinessProfile(dbUser.id);
        } else if (dbUser.role === 'job_seeker') {
          profile = await storage.getJobSeekerProfile(dbUser.id);
        }
        
        res.json({ user: dbUser, profile });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Role selection endpoint
  app.get('/api/auth/select-role/:role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.oidc.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.oidc.user.sub;
      const { role } = req.params;
      
      // Validate role
      if (role !== 'business' && role !== 'job_seeker') {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      // Get existing user to maintain data
      const existingUser = await storage.getUserByEmail(req.oidc.user.email);
      
      // Update user role
      const userData = {
        id: userId,
        email: req.oidc.user.email,
        firstName: req.oidc.user.given_name || existingUser?.firstName || null,
        lastName: req.oidc.user.family_name || existingUser?.lastName || null, 
        profileImageUrl: req.oidc.user.picture || existingUser?.profileImageUrl || null,
        role: role as 'business' | 'job_seeker'
      };
      
      console.log("Updating user role:", userData);
      const updatedUser = await storage.upsertUser(userData);
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.oidc.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
}

// Role-based middleware for business users
export function isBusinessUser(req: Request, res: Response, next: NextFunction) {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const checkRole = async () => {
    try {
      const user = req.oidc.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = user.sub;
      const dbUser = await storage.getUserByEmail(user.email);
      
      if (!dbUser || dbUser.role !== 'business') {
        return res.status(403).json({ message: "Access denied: Business account required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking business role:", error);
      res.status(500).json({ message: "Error checking user role" });
    }
  };
  
  checkRole();
}

// Role-based middleware for job seekers
export function isJobSeeker(req: Request, res: Response, next: NextFunction) {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const checkRole = async () => {
    try {
      const user = req.oidc.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = user.sub;
      const dbUser = await storage.getUserByEmail(user.email);
      
      if (!dbUser || dbUser.role !== 'job_seeker') {
        return res.status(403).json({ message: "Access denied: Job seeker account required" });
      }
      
      next();
    } catch (error) {
      console.error("Error checking job seeker role:", error);
      res.status(500).json({ message: "Error checking user role" });
    }
  };
  
  checkRole();
}