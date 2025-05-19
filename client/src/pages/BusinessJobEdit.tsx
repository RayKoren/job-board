import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, ArrowLeft, Save, Trash } from 'lucide-react';
import BusinessLayout from '@/components/BusinessLayout';
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

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
  type: z.string().min(1, 'Job type is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.string().min(20, 'Requirements must be at least 20 characters'),
  benefits: z.string().optional(),
  compensationType: z.string(),
  salaryRange: z.string().optional(),
  hourlyRate: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  applicationUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  status: z.string().default('active'),
});

// Type for the form values
type FormValues = z.infer<typeof formSchema>;

export default function BusinessJobEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  
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
  
  // Setup form with job data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      type: '',
      description: '',
      requirements: '',
      benefits: '',
      compensationType: '',
      salaryRange: '',
      hourlyRate: '',
      contactEmail: '',
      contactPhone: '',
      applicationUrl: '',
      tags: [],
      status: 'active',
    },
  });
  
  // Update form values when job data is loaded
  useEffect(() => {
    if (job) {
      // Reset form with job data
      form.reset({
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        type: job.type || '',
        description: job.description || '',
        requirements: job.requirements || '',
        benefits: job.benefits || '',
        compensationType: job.compensationType || '',
        salaryRange: job.salaryRange || '',
        hourlyRate: job.hourlyRate || '',
        contactEmail: job.contactEmail || '',
        contactPhone: job.contactPhone || '',
        applicationUrl: job.applicationUrl || '',
        tags: job.tags || [],
        status: job.status || 'active',
      });
      
      // Update tags input
      if (job.tags && job.tags.length > 0) {
        setTagsInput(job.tags.join(', '));
      }
    }
  }, [job, form]);
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await apiRequest('PUT', `/api/jobs/${id}`, values);
      if (!response.ok) {
        throw new Error('Failed to update job posting');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/business/jobs', id] });
      
      toast({
        title: 'Job updated',
        description: 'Your job posting has been updated successfully',
      });
      
      navigate('/business/dashboard');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update job posting: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete mutation
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
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // Process tags from comma-separated string to array
    if (tagsInput.trim()) {
      values.tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
    } else {
      values.tags = [];
    }
    
    // Submit form data
    updateMutation.mutate(values);
  };
  
  // Handle delete job
  const handleDeleteJob = () => {
    deleteMutation.mutate();
  };
  
  // Handle tags input change
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
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
            <p>Error loading job details. The job posting may have been deleted or you don't have permission to edit it.</p>
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
    <BusinessLayout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-forest">Edit Job Posting</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/business/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Job Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-forest">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Senior Web Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sheridan, WY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="gig">Gig</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Compensation Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-forest">Compensation</h2>
              
              <FormField
                control={form.control}
                name="compensationType"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Compensation Type*</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset salary/hourly fields when changing type
                        if (value === 'Salary') {
                          form.setValue('hourlyRate', '');
                        } else if (value === 'Hourly') {
                          form.setValue('salaryRange', '');
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select compensation type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Salary">Salary</SelectItem>
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="undisclosed">Undisclosed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.watch('compensationType') === 'Salary' && (
                  <FormField
                    control={form.control}
                    name="salaryRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary Range</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. $50,000 - $70,000 per year" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch('compensationType') === 'Hourly' && (
                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. $15 - $20 per hour" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            {/* Job Details */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-forest">Job Details</h2>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Job Description*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the job responsibilities and role..." 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel>Job Requirements*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Required qualifications, skills, and experience..." 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Benefits, perks, and other incentives..." 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Contact Information */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-forest">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. jobs@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. (307) 555-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="applicationUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Application URL</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. https://company.com/careers/apply" {...field} />
                      </FormControl>
                      <FormDescription>
                        External link where applicants can apply directly
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Additional Options */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-forest">Additional Options</h2>
              
              <div className="mb-6">
                <FormLabel>Tags (comma-separated)</FormLabel>
                <Input
                  value={tagsInput}
                  onChange={handleTagsChange}
                  placeholder="e.g. remote, healthcare, programming"
                />
                <FormDescription>
                  Add relevant keywords to help job seekers find your posting
                </FormDescription>
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only active jobs will be visible to job seekers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Form controls */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/business/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-forest hover:bg-forest/90"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </BusinessLayout>
  );
}