import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

// Pages
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import PostJob from "@/pages/PostJob";
import JobListings from "@/pages/JobListings";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import BusinessProfile from "@/pages/BusinessProfile";
import JobSeekerProfile from "@/pages/JobSeekerProfile";
import BusinessDashboard from "@/pages/BusinessDashboard";
import JobSeekerDashboard from "@/pages/JobSeekerDashboard";
import LoginPage from "@/pages/LoginPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import RoleSelection from "@/pages/RoleSelection";
import PaymentPage from "@/pages/PaymentPage";
import PaymentSuccess from "@/pages/PaymentSuccess";
import BusinessJobView from "@/pages/BusinessJobView";
import BusinessJobEdit from "@/pages/BusinessJobEdit";
import BusinessJobApplications from "@/pages/BusinessJobApplications";
import UserProfile from "@/pages/UserProfile";


// Components
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AuthProvider, LoginButton } from "@/components/AuthProvider";
import { useAuth } from "@/hooks/useAuth";

// Protected route wrapper
function ProtectedRoute({ 
  component: Component, 
  requiredRole 
}: { 
  component: React.ComponentType<any>, 
  requiredRole?: 'business' | 'job_seeker' 
}) {
  const { isAuthenticated, isBusinessUser, isJobSeeker, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      setLocation('/login');
      return;
    }
    
    // Check if user needs to select a role
    if (user && !user.role) {
      setLocation('/select-role');
      return;
    }

    if (requiredRole === 'business' && !isBusinessUser) {
      // Redirect if not a business user
      setLocation('/');
      return;
    }

    if (requiredRole === 'job_seeker' && !isJobSeeker) {
      // Redirect if not a job seeker
      setLocation('/');
      return;
    }
  }, [isAuthenticated, user, requiredRole, isBusinessUser, isJobSeeker, setLocation]);

  if (!isAuthenticated || (user && !user.role) || 
      (requiredRole === 'business' && !isBusinessUser) || 
      (requiredRole === 'job_seeker' && !isJobSeeker)) {
    return null;
  }

  return <Component />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/legacy-login" component={LoginPage} />
          <Route path="/select-role" component={RoleSelection} />
          <Route path="/pricing" component={() => {
            return (
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <header className="pt-28 pb-8 bg-forest text-white text-center">
                  <h1 className="text-4xl font-bold mb-4">Job Posting Plans & Pricing</h1>
                  <p className="text-xl max-w-2xl mx-auto px-4">
                    Choose the right plan to connect with job seekers in Sheridan County
                  </p>
                </header>
                <main className="flex-grow">
                  <Pricing />
                </main>
                <Footer />
              </div>
            );
          }} />
          <Route path="/post-job" component={PostJob} />
          <Route path="/jobs" component={JobListings} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />

          {/* Business Routes (Protected) */}
          <Route 
            path="/business/profile" 
            component={() => <ProtectedRoute component={BusinessProfile} requiredRole="business" />} 
          />
          <Route 
            path="/business/dashboard" 
            component={() => <ProtectedRoute component={BusinessDashboard} requiredRole="business" />} 
          />
          <Route 
            path="/business/jobs/:id" 
            component={() => <ProtectedRoute component={BusinessJobView} requiredRole="business" />} 
          />
          <Route 
            path="/business/jobs/:id/edit" 
            component={() => <ProtectedRoute component={BusinessJobEdit} requiredRole="business" />} 
          />
          <Route 
            path="/business/jobs/:id/applications" 
            component={() => <ProtectedRoute component={BusinessJobApplications} requiredRole="business" />} 
          />
          
          {/* Job Seeker Routes (Protected) */}
          <Route 
            path="/job-seeker/profile" 
            component={() => <ProtectedRoute component={JobSeekerProfile} requiredRole="job_seeker" />} 
          />
          <Route 
            path="/job-seeker/dashboard" 
            component={() => <ProtectedRoute component={JobSeekerDashboard} requiredRole="job_seeker" />} 
          />

          {/* Profile Route (Protected) */}
          <Route 
            path="/profile" 
            component={() => <ProtectedRoute component={UserProfile} />} 
          />
          
          {/* Payment Routes */}
          <Route 
            path="/payment" 
            component={() => <ProtectedRoute component={PaymentPage} requiredRole="business" />} 
          />
          <Route path="/payment-success" component={PaymentSuccess} />
          
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
