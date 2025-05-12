import { Switch, Route } from "wouter";
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

// Components
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { AuthProvider, LoginButton } from "@/components/AuthProvider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/" component={Home} />
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

          {/* Business Routes */}
          <Route path="/business/profile" component={BusinessProfile} />
          <Route path="/business/dashboard" component={BusinessDashboard} />
          
          {/* Job Seeker Routes */}
          <Route path="/job-seeker/profile" component={JobSeekerProfile} />
          <Route path="/job-seeker/dashboard" component={JobSeekerDashboard} />
          
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
