import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Save, 
  ArrowLeft, 
  Plus, 
  X,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const jobTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Internship",
  "Volunteer",
  "Gig"
];

const compensationTypes = [
  "Salary",
  "Hourly",
  "undisclosed"
];

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters." }),
  company: z.string().min(2, { message: "Company name is required." }),
  location: z.string().min(2, { message: "Location is required." }),
  type: z.string().min(1, { message: "Job type is required." }),
  description: z.string().min(20, { message: "Description must be at least 20 characters." }),
  requirements: z.string().min(10, { message: "Requirements must be at least 10 characters." }),
  benefits: z.string().optional(),
  compensationType: z.string(),
  salaryRange: z.string().optional(),
  hourlyRate: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  applicationUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export default function BusinessJobEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
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
  
  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      type: "",
      description: "",
      requirements: "",
      benefits: "",
      compensationType: "Salary",
      salaryRange: "",
      hourlyRate: "",
      contactEmail: "",
      contactPhone: "",
      applicationUrl: "",
      tags: [],
    },
  });
  
  // Update form when job data is loaded
  useEffect(() => {
    if (job) {
      form.reset({
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits || "",
        compensationType: job.compensationType,
        salaryRange: job.salaryRange || "",
        hourlyRate: job.hourlyRate || "",
        contactEmail: job.contactEmail || "",
        contactPhone: job.contactPhone || "",
        applicationUrl: job.applicationUrl || "",
        tags: [],
      });
      
      // Initialize tags
      if (job.tags && Array.isArray(job.tags)) {
        setTags(job.tags);
      }
    }
  }, [job, form]);
  
  // Update job mutation
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      setIsSaving(true);
      
      // Add tags to the values
      const updateData = {
        ...values,
        tags,
      };
      
      const response = await apiRequest('PUT', `/api/business/jobs/${id}`, updateData);
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
      navigate(`/business/jobs/${id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update job: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate(values);
  };
  
  // Tag handlers
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-forest" />
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (error || !job) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50">
          <div className="py-8 px-4 max-w-5xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>Error loading job details. The job posting may have been deleted or you don't have permission to edit it.</p>
            </div>
            <Button asChild>
              <Link to="/business/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen bg-gray-50">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" asChild>
            <Link to={`/business/jobs/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job View
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-forest">Edit Job Posting</CardTitle>
            <CardDescription>
              Update the information for your job posting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Title */}
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
                  
                  {/* Company Name */}
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
                  
                  {/* Location */}
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
                  
                  {/* Job Type */}
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
                            {jobTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Job Description */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the job responsibilities and expectations" 
                              className="min-h-[150px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Job Requirements */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Requirements*</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List qualifications, skills, and experience required" 
                              className="min-h-[150px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Benefits */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe perks, benefits, and incentives" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Compensation Type */}
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="compensationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compensation Type</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset related fields when compensation type changes
                              if (value === "Salary") {
                                form.setValue("hourlyRate", "");
                              } else if (value === "Hourly") {
                                form.setValue("salaryRange", "");
                              } else {
                                form.setValue("salaryRange", "");
                                form.setValue("hourlyRate", "");
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
                              {compensationTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type === "undisclosed" ? "Undisclosed" : type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Salary Range - only shown when compensationType is Salary */}
                  {form.watch("compensationType") === "Salary" && (
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
                  
                  {/* Hourly Rate - only shown when compensationType is Hourly */}
                  {form.watch("compensationType") === "Hourly" && (
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
                  
                  {/* Contact Email */}
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. jobs@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Contact Phone */}
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Application URL */}
                  <FormField
                    control={form.control}
                    name="applicationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. https://your-company.com/careers" 
                            {...field} 
                            onChange={(e) => {
                              let value = e.target.value;
                              // Add https:// prefix if the URL doesn't have a protocol
                              if (value && value.trim() !== "" && !value.match(/^https?:\/\//)) {
                                value = `https://${value}`;
                              }
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Direct applicants to your own application page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Tags */}
                  <div className="col-span-1 md:col-span-2">
                    <FormLabel>Tags (Optional)</FormLabel>
                    <div className="flex gap-2 mb-2">
                      <Input
                        placeholder="Add tags (press Enter)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={addTag}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="rounded-full hover:bg-gray-200 p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Job Status and Plan Info (Read-only) */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="job-info">
                    <AccordionTrigger>Job Posting Information</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <p className="font-medium">Status:</p>
                          <Badge>{job.status}</Badge>
                        </div>
                        <div>
                          <p className="font-medium">Plan:</p>
                          <Badge>{job.plan}</Badge>
                        </div>
                        {job.expiresAt && (
                          <div>
                            <p className="font-medium">Expires:</p>
                            <p>{new Date(job.expiresAt).toLocaleDateString()}</p>
                          </div>
                        )}
                        {job.addons && job.addons.length > 0 && (
                          <div>
                            <p className="font-medium">Add-ons:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {job.addons.map((addon, index) => (
                                <Badge key={index} variant="outline">
                                  {addon}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-sm text-gray-500 italic">
                          Note: To change the plan, add-ons, or extend posting duration, 
                          please submit a new job posting.
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                {/* Submit Button */}
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    asChild
                  >
                    <Link to={`/business/jobs/${id}`}>
                      Cancel
                    </Link>
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                  >
                    {isSaving ? (
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
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}