import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Setup for local auth (temporary solution while transitioning)
export function setupAuth(app: Express) {
  // Auth middleware to attach to app
  
  console.log('Setting up local authentication');
  
  // We'll use session directly without Auth0

  // Mock login route
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      let user = await storage.getUserByEmail(email);
      
      // Create user if doesn't exist
      if (!user) {
        console.log('Creating new user with email:', email);
        user = await storage.upsertUser({
          id: `local-${Date.now()}`,
          email,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          role: null
        });
      }
      
      // Store user in session
      req.session.user = user;
      
      // Check if user has role
      if (!user.role) {
        return res.json({ needsRoleSelection: true, user });
      }
      
      return res.json({ user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });
  
  // Get user data
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      
      // Get profile data based on role
      let profile = null;
      if (user.role === 'business') {
        profile = await storage.getBusinessProfile(user.id);
      } else if (user.role === 'job_seeker') {
        profile = await storage.getJobSeekerProfile(user.id);
      }
      
      res.json({ user, profile });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
  
  // Check if user needs role selection
  app.get('/api/auth/check-role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      
      if (!user || !user.role) {
        return res.json({ needsRoleSelection: true });
      }
      
      res.json({ 
        needsRoleSelection: false,
        role: user.role,
        dashboardUrl: user.role === 'business' ? '/business/dashboard' : '/jobseeker/dashboard'
      });
    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({ message: 'Failed to check user role' });
    }
  });
  
  // Select role
  app.get('/api/auth/select-role/:role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      const { role } = req.params;
      
      // Validate role
      if (role !== 'business' && role !== 'job_seeker') {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Update user role
      const updatedUser = await storage.upsertUser({
        ...user,
        role: role as 'business' | 'job_seeker'
      });
      
      // Update session
      req.session.user = updatedUser;
      
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });
  
  // Logout
  app.get('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      res.json({ success: true });
    });
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    return next();
  }
  
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user is a business
export function isBusinessUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.session.user.role !== 'business') {
    return res.status(403).json({ message: 'Access denied: Business account required' });
  }
  
  next();
}

// Middleware to check if user is a job seeker
export function isJobSeeker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.session.user.role !== 'job_seeker') {
    return res.status(403).json({ message: 'Access denied: Job seeker account required' });
  }
  
  next();
}

// Add session user property to Express session
declare module 'express-session' {
  interface SessionData {
    user: any;
  }
}