import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Building, 
  Briefcase, 
  DollarSign, 
  Mail, 
  Phone, 
  Clock, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import BusinessLayout from '@/components/BusinessLayout';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow, format } from 'date-fns';

export default function BusinessJobView() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['/api/business/jobs', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/business/jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      return response.json();
    },
  });
  
  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      setIsDeleting(true);
      const response = await apiRequest('DELETE', `/api/jobs/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete job posting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/jobs'] });
      toast({
        title: 'Job deleted',
        description: 'Your job posting has been deleted successfully',
      });
      navigate('/business/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete job posting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });
  
  const handleDeleteJob = () => {
    deleteMutation.mutate();
  };
  
  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Format posting date as "Posted X days ago"
  const formatPostedDate = (dateString?: string | null) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return `Posted ${formatDistanceToNow(date, { addSuffix: false })} ago`;
    } catch (e) {
      return 'Recently';
    }
  };
  
  if (isLoading) {
    return (
      <BusinessLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
        </div>
      </BusinessLayout>
    );
  }
  
  if (error || !job) {
    return (
      <BusinessLayout>
        <div className="py-8 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error loading job details. The job posting may have been deleted or you don't have permission to view it.</p>
          </div>
          <Button asChild>
            <Link to="/business/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </BusinessLayout>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to="/business/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/business/jobs/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit Job
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" /> Delete Job
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
                    onClick={handleDeleteJob}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
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
        </div>
        
        <Card className={`
          border-gray-200 mb-8 overflow-hidden
          ${job.featured ? 'border-l-4 border-clay' : ''}
          ${job.addons?.includes('highlighted') ? 'bg-amber-100' : ''}
          ${job.addons?.includes('top-of-search') ? 'ring-2 ring-forest' : ''}
        `}>
          <CardHeader className="pb-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {job.featured && (
                <Badge className="bg-clay">Featured</Badge>
              )}
              {job.addons?.includes('urgent') && (
                <Badge className="bg-red-600 text-white flex items-center gap-1">
                  <span className="animate-pulse">⚡</span> Urgent Hiring
                </Badge>
              )}
              {job.addons?.includes('top-of-search') && (
                <Badge className="bg-forest text-white">
                  Promoted
                </Badge>
              )}
              <Badge variant="outline">{job.type}</Badge>
              <Badge variant="outline">{job.status}</Badge>
            </div>
            <CardTitle className="text-2xl font-bold text-forest">{job.title}</CardTitle>
            <div className="text-gray-600 flex items-center mt-1">
              <Building className="h-4 w-4 mr-1" />
              <span>{job.company}</span>
            </div>
          </CardHeader>
          
          <CardContent className="pt-4 pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-clay" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Briefcase className="h-4 w-4 mr-2 text-clay" />
                <span>{job.type}</span>
              </div>
              {job.compensationType && (
                <div className="flex items-center text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2 text-clay" />
                  <span>
                    {job.compensationType === 'Salary' ? job.salaryRange : ''}
                    {job.compensationType === 'Hourly' ? job.hourlyRate : ''}
                    {job.compensationType === 'undisclosed' ? 'Undisclosed' : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2 text-clay" />
                <span>{formatPostedDate(job.createdAt)}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-clay" />
                <span>Expires: {formatDate(job.expiresAt)}</span>
              </div>
              {job.contactEmail && (
                <div className="flex items-center text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-clay" />
                  <span>{job.contactEmail}</span>
                </div>
              )}
              {job.contactPhone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-clay" />
                  <span>{job.contactPhone}</span>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-forest">Description</h3>
              <div className="text-gray-700 whitespace-pre-line">{job.description}</div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-forest">Requirements</h3>
              <div className="text-gray-700 whitespace-pre-line">{job.requirements}</div>
            </div>
            
            {job.benefits && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-forest">Benefits</h3>
                <div className="text-gray-700 whitespace-pre-line">{job.benefits}</div>
              </div>
            )}
            
            {job.tags && job.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-forest">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-100">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {job.applicationUrl && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-forest">Application URL</h3>
                <a 
                  href={job.applicationUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-forest hover:underline flex items-center"
                >
                  {job.applicationUrl} <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-4 flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Plan: <Badge>{job.plan}</Badge>
              </p>
              {job.addons && job.addons.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Add-ons: {job.addons.map((addon, index) => (
                    <Badge key={index} variant="outline" className="ml-1">
                      {addon}
                    </Badge>
                  ))}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to={`/business/jobs/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Job
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/business/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </>
  );
}