import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, ExternalLink, Star, Tag, Briefcase, MapPin, Calendar, Home, Eye, MessageSquare, Users, Mail, Phone } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import LogoUpload from "@/components/LogoUpload";

export default function BusinessDashboard() {
  const { isAuthenticated, isBusinessUser } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const { data: businessProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/business/profile"],
    enabled: isAuthenticated && isBusinessUser,
  });

  // Type the business profile data properly
  const profile = businessProfile as any;

  const { data: jobPostings, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/business/jobs"],
    enabled: isAuthenticated && isBusinessUser,
  });

  const handleDeleteJob = async (jobId: number) => {
    setIsDeleting(jobId);
    
    try {
      await apiRequest("DELETE", `/api/jobs/${jobId}`);
      
      // Invalidate the jobs query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["/api/business/jobs"] });
      
      toast({
        title: "Job deleted",
        description: "The job posting has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        title: "Error",
        description: "Could not delete job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isAuthenticated || !isBusinessUser) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-forest mb-4">Business Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">
          You need to be logged in as a business user to access this page.
        </p>
        <Button asChild>
          <a href="/api/login?role=business">Log in as Business</a>
        </Button>
      </div>
    );
  }

  const isLoading = isLoadingProfile || isLoadingJobs;

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest">Business Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your job postings and view applications
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link to="/post-job" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Post New Job
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/business/profile">
              Edit Business Profile
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

      {/* Business Profile Summary */}
      {isLoadingProfile ? (
        <Card className="mb-8">
          <CardContent className="flex justify-center items-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-forest" />
          </CardContent>
        </Card>
      ) : !businessProfile ? (
        <Card className="mb-8 border-amber-300 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">Complete Your Profile</CardTitle>
            <CardDescription className="text-amber-700">
              Setting up your business profile will make your job postings more attractive to job seekers.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link to="/business/profile">
                Set Up Business Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{profile?.companyName}</CardTitle>
            <CardDescription>
              {profile?.industry && (
                <span className="inline-flex items-center mr-4">
                  <Briefcase className="w-4 h-4 mr-1" />
                  {profile.industry}
                </span>
              )}
              {profile?.location && (
                <span className="inline-flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {profile.location}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.description && (
              <p className="text-gray-600 mb-4">{profile.description}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {profile?.contactEmail && (
                <div className="inline-flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-1" />
                  <span className="break-all">{profile.contactEmail}</span>
                </div>
              )}
              {profile?.contactPhone && (
                <div className="inline-flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-1" />
                  <span>{profile.contactPhone}</span>
                </div>
              )}
              {profile?.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-forest hover:underline break-all"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Website
                </a>
              )}
            </div>
          </CardContent>
          <CardContent>
            <LogoUpload 
              currentLogoUrl={profile?.logoData ? `/api/logo/${profile.userId}` : null}
              onUploadSuccess={() => {
                // Refresh business profile data
                queryClient.invalidateQueries({ queryKey: ['/api/business/profile'] });
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Job Postings */}
      <h2 className="text-2xl font-semibold text-forest mb-4">Your Job Postings</h2>
      
      {isLoadingJobs ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-forest" />
        </div>
      ) : !jobPostings || jobPostings.length === 0 ? (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
            <Button asChild>
              <Link to="/post-job" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post Your First Job
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobPostings.map((job) => (
            <Card key={job.id} className={job.featured ? "border-amber-300" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl break-words">{job.title}</CardTitle>
                    <CardDescription className="mt-1 break-words">
                      <span className="break-all">{job.company}</span> • <span className="break-words">{job.location}</span>
                    </CardDescription>
                  </div>
                  {job.featured && (
                    <Badge variant="outline" className="border-amber-400 text-amber-600 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Job Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {job.clickCount || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {job.applicationCount || 0} applications
                  </span>

                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{job.type}</Badge>
                  {job.compensationType === "Salary" && job.salaryRange && (
                    <Badge variant="secondary">{job.salaryRange}</Badge>
                  )}
                  {job.compensationType === "Hourly" && job.hourlyRate && (
                    <Badge variant="secondary">{job.hourlyRate}/hr</Badge>
                  )}
                  {job.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">
                  {job.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  Posted {(() => {
                    try {
                      return formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });
                    } catch (e) {
                      return 'recently';
                    }
                  })()}
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 w-full">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/business/jobs/${job.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/business/jobs/${job.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/business/jobs/${job.id}/applications`}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Applications
                      {job.applicationCount ? (
                        <Badge variant="secondary" className="ml-1">{job.applicationCount}</Badge>
                      ) : null}
                    </Link>
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/business/jobs/${job.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Posting</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this job posting? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-500 hover:bg-red-600"
                          onClick={() => handleDeleteJob(job.id)}
                          disabled={isDeleting === job.id}
                        >
                          {isDeleting === job.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}