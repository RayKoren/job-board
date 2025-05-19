import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, ChevronLeft, Mail, Phone, User, Briefcase, MapPin, Download, CalendarDays, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function BusinessJobApplications() {
  const { id } = useParams();
  const jobId = parseInt(id);
  const { isAuthenticated, isBusinessUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const { data: job, isLoading: isLoadingJob } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    enabled: !!jobId && isAuthenticated && isBusinessUser,
  });
  
  const { data: applications, isLoading: isLoadingApplications } = useQuery({
    queryKey: [`/api/jobs/${jobId}/applications`],
    enabled: !!jobId && isAuthenticated && isBusinessUser,
  });
  
  // Filter applications by status
  const filteredApplications = selectedStatus
    ? applications?.filter(app => app.status === selectedStatus)
    : applications;
  
  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login");
    } else if (isBusinessUser === false) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You need a business account to access this page.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isBusinessUser, navigate, toast]);
  
  // Update application status
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await apiRequest("PUT", `/api/applications/${applicationId}/status`, {
        status: newStatus
      });
      
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
      
      // Refetch applications
      const queryKey = [`/api/jobs/${jobId}/applications`];
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoadingJob || isLoadingApplications) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 px-4 min-h-screen">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-forest" />
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (!job) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto py-8 px-4 min-h-screen">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Job Not Found</h1>
            <p className="mb-6">The job you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button asChild>
              <Link to="/business">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <>
      <Navbar />
      <div className="container mx-auto py-8 px-4 min-h-screen">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" asChild className="mr-4">
            <Link to="/business">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-forest">Applications for {job.title}</h1>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <CardDescription className="mt-1">
                  <span className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.company}
                  </span>
                  <span className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </span>
                </CardDescription>
              </div>
              <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-1" />
                Posted {job.postedAt ? format(new Date(job.postedAt), 'MMM d, yyyy') : 'Recently'}
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-2 md:mt-0">
                {job.expiresAt && (
                  <>
                    <span className="mr-2">Expires:</span>
                    {format(new Date(job.expiresAt), 'MMM d, yyyy')}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Applicants {applications?.length > 0 && `(${applications.length})`}
          </h2>
          
          <div className="flex items-center">
            <span className="mr-2">Filter by status:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Applications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {!filteredApplications || filteredApplications.length === 0 ? (
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">No applications found.</p>
              {selectedStatus && (
                <Button variant="outline" onClick={() => setSelectedStatus("")}>
                  Show All Applications
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Avatar className="mr-4">
                        <AvatarFallback className="bg-forest text-white">
                          {getInitials(application.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{application.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            <a href={`mailto:${application.email}`} className="hover:underline text-forest">
                              {application.email}
                            </a>
                          </div>
                          {application.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="w-4 h-4 mr-1" />
                              <a href={`tel:${application.phone}`} className="hover:underline text-forest">
                                {application.phone}
                              </a>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge className={getStatusColor(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        Applied {application.appliedAt ? format(new Date(application.appliedAt), 'MMM d, yyyy') : 'Recently'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {application.profile && (
                    <div className="mb-4 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold mb-2">Applicant Profile</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {application.profile.title && (
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm">{application.profile.title}</span>
                          </div>
                        )}
                        
                        {application.profile.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm">{application.profile.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {application.profile.skills && application.profile.skills.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-xs font-semibold mb-1 text-gray-500">Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {application.profile.skills.map((skill, index) => (
                              <Badge key={index} variant="outline" className="bg-gray-50">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {application.profile.resumeUrl && (
                        <div className="mt-3">
                          <a 
                            href={application.profile.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-forest hover:underline"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Resume
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {application.coverLetter && (
                    <div className="mb-4 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-semibold mb-2">Cover Letter</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{application.coverLetter}</p>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="bg-gray-50 py-3 flex justify-end">
                  <Select 
                    defaultValue={application.status}
                    onValueChange={(value) => handleStatusChange(application.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Mark as Pending</SelectItem>
                      <SelectItem value="reviewed">Mark as Reviewed</SelectItem>
                      <SelectItem value="contacted">Mark as Contacted</SelectItem>
                      <SelectItem value="rejected">Mark as Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}