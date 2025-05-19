import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ExternalLink, User, MapPin, FileText, Phone, Mail, Calendar, Clock, Home } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function JobSeekerDashboard() {
  const { user, isAuthenticated, isJobSeeker } = useAuth();

  const { data: jobSeekerProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/job-seeker/profile"],
    enabled: isAuthenticated && isJobSeeker,
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["/api/my-applications"],
    enabled: isAuthenticated && isJobSeeker,
  });

  if (!isAuthenticated || !isJobSeeker) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-forest mb-4">Job Seeker Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">
          You need to be logged in as a job seeker to access this page.
        </p>
        <Button asChild>
          <a href="/api/login?role=job_seeker">Log in as Job Seeker</a>
        </Button>
      </div>
    );
  }

  const isLoading = isLoadingProfile || isLoadingApplications;

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest">Job Seeker Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your profile and track your job applications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link to="/jobs" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Browse Jobs
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/job-seeker/profile">
              Edit Profile
            </Link>
          </Button>
          
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Summary */}
      {isLoadingProfile ? (
        <Card className="mb-8">
          <CardContent className="flex justify-center items-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-forest" />
          </CardContent>
        </Card>
      ) : !jobSeekerProfile ? (
        <Card className="mb-8 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Complete Your Profile</CardTitle>
            <CardDescription className="text-amber-700">
              Setting up your profile will make it easier to apply for jobs and be discovered by employers.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/job-seeker/profile">
                Set Up Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {jobSeekerProfile.title || "Job Seeker"}
            </CardTitle>
            <CardDescription>
              {jobSeekerProfile.location && (
                <span className="inline-flex items-center mr-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {jobSeekerProfile.location}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobSeekerProfile.bio && (
              <p className="text-gray-600 mb-4">{jobSeekerProfile.bio}</p>
            )}
            
            {jobSeekerProfile.skills && jobSeekerProfile.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobSeekerProfile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4">
              {/* Resume download now uses API endpoint with userId */}
              {(jobSeekerProfile.resumeData || jobSeekerProfile.resumeName) && (
                <a 
                  href={`/api/resume/${user?.id}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-forest hover:underline"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Resume {jobSeekerProfile.resumeName ? `(${jobSeekerProfile.resumeName})` : ''}
                </a>
              )}
              
              {jobSeekerProfile.phone && (
                <span className="inline-flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  {jobSeekerProfile.phone}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Applications */}
      <h2 className="text-2xl font-semibold text-forest mb-4">Your Applications</h2>
      
      {isLoadingApplications ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-forest" />
        </div>
      ) : !applications || applications.length === 0 ? (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
            <Button asChild>
              <Link to="/jobs" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Find Jobs to Apply
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{application.job?.title || "Job Application"}</CardTitle>
                    <CardDescription className="mt-1">
                      {application.job?.company || ""} • {application.job?.location || ""}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={
                      application.status === "contacted" ? "default" :
                      application.status === "rejected" ? "destructive" :
                      application.status === "reviewed" ? "outline" : "secondary"
                    }
                  >
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    {application.name}
                  </div>
                  
                  <div className="flex items-center text-gray-500">
                    <Mail className="w-4 h-4 mr-2" />
                    {application.email}
                  </div>
                  
                  {application.phone && (
                    <div className="flex items-center text-gray-500">
                      <Phone className="w-4 h-4 mr-2" />
                      {application.phone}
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    Applied {application.createdAt ? formatDistanceToNow(new Date(application.createdAt), { addSuffix: true }) : 'recently'}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/jobs/${application.jobId}`}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Job
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}