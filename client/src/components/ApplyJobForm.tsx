import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Phone, Mail, ExternalLink, FileText } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  coverLetter: z.string().optional(),
  shareProfile: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface ApplyJobFormProps {
  jobId: number;
  jobTitle: string;
  company: string;
  isOpen: boolean;
  onClose: () => void;
  contactInfo?: {
    email?: string;
    phone?: string;
    applicationUrl?: string;
  };
  onSuccess?: () => void;
}

export default function ApplyJobForm({ 
  jobId,
  jobTitle,
  company,
  isOpen,
  onClose,
  contactInfo,
  onSuccess
}: ApplyJobFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);
  const [isProfileShown, setIsProfileShown] = useState(false);
  
  // Get job seeker profile data if user is authenticated
  const { data: profileData } = useQuery({
    queryKey: ["/api/job-seeker/profile"],
    enabled: isAuthenticated,
  });
  
  // Initialize form with user data if available
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      phone: "",
      coverLetter: "",
      shareProfile: false,
    },
  });
  
  /**
   * Handles the submission of a job application form
   * @param {FormValues} data - The form data containing applicant information
   * @returns {Promise<void>} Resolves when application is successfully submitted
   */
  const onSubmit = async (data: FormValues) => {
    // Check if user is authenticated before allowing submission
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You must be logged in to apply for jobs.",
        variant: "destructive",
      });
      onClose();
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Track the click for analytics
      await apiRequest("POST", `/api/jobs/${jobId}/track-click`);
      
      // Submit the application
      await apiRequest("POST", "/api/job-applications", {
        jobId,
        ...data,
      });
      
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
      });
      
      // Invalidate business jobs cache to update application count
      queryClient.invalidateQueries({ queryKey: ["/api/business/jobs"] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: "Could not submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  /**
   * Handles when a user indicates they've applied directly to the employer
   * This tracks the interaction for analytics without creating a formal application record
   * @returns {Promise<void>} Resolves when the click tracking is completed
   */
  const handleDirectApplication = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to track your application.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingDirect(true);
    try {
      // Track the click/application
      await apiRequest("POST", `/api/jobs/${jobId}/track-click`);
      
      toast({
        title: "Thank you!",
        description: "We've recorded that you applied directly. Good luck with your application!",
      });
      
      // Invalidate business jobs cache to update click count
      queryClient.invalidateQueries({ queryKey: ["/api/business/jobs"] });
      
      // Close the modal and call success callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  /**
   * Shows employer contact information and tracks the interaction
   * Called when user wants to see contact details for direct application
   * @returns {void}
   */
  const showContactInfo = () => {
    // Track the click for analytics
    apiRequest("POST", `/api/jobs/${jobId}/track-click`);
    setIsProfileShown(true);
  };
  
  // Format profile data for display when consenting to share
  const getProfilePreview = () => {
    if (!profileData) return null;
    
    // Use type assertion to access profile properties
    const profile = profileData as any;
    
    return (
      <Card className="mt-4 border-dashed border-gray-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Profile information to be shared</CardTitle>
          <CardDescription>This information will be visible to the employer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {profile.title && (
            <div>
              <span className="font-medium">Title:</span> {profile.title}
            </div>
          )}
          {profile.location && (
            <div>
              <span className="font-medium">Location:</span> {profile.location}
            </div>
          )}
          {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 && (
            <div>
              <span className="font-medium">Skills:</span> {profile.skills.join(", ")}
            </div>
          )}
          {profile.resumeUrl && (
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-1 text-forest" />
              <span className="font-medium">Resume:</span> Attached
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md md:max-w-lg sm:max-w-[425px] max-h-[80vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
          <DialogDescription>
            Submit your application to {company}
          </DialogDescription>
        </DialogHeader>
        
        {!isProfileShown && contactInfo && (contactInfo.email || contactInfo.phone || contactInfo.applicationUrl) ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="mb-4">You can apply directly using the employer's contact information:</p>
              
              <div className="space-y-2">
                {contactInfo.email && (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4 text-forest" />
                    <a 
                      href={`mailto:${contactInfo.email}?subject=Application for ${jobTitle}`}
                      className="text-forest hover:underline break-all"
                    >
                      {contactInfo.email}
                    </a>
                  </div>
                )}
                
                {contactInfo.phone && (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="h-4 w-4 text-forest" />
                    <a 
                      href={`tel:${contactInfo.phone}`}
                      className="text-forest hover:underline"
                    >
                      {contactInfo.phone}
                    </a>
                  </div>
                )}
                
                {contactInfo.applicationUrl && (
                  <div className="flex items-center justify-center gap-2">
                    <ExternalLink className="h-4 w-4 text-forest" />
                    <a 
                      href={contactInfo.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-forest hover:underline"
                    >
                      Application Link
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDirectApplication}
                  disabled={isSubmittingDirect}
                >
                  {isSubmittingDirect ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    "I've Applied Directly"
                  )}
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">OR</p>
            </div>
          </div>
        ) : null}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your full name" maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your email address" maxLength={100} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Your phone number" maxLength={20} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Tell the employer why you're a good fit for the position"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isAuthenticated && profileData && (
              <FormField
                control={form.control}
                name="shareProfile"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-start space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Share my profile with this employer
                        </FormLabel>
                        <FormDescription>
                          Include your job seeker profile details with this application
                        </FormDescription>
                      </div>
                    </div>
                    {field.value && (
                      <Card className="mt-4 border-dashed border-gray-300">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md">Profile information to be shared</CardTitle>
                          <CardDescription>This information will be visible to the employer</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {(profileData as any)?.title && (
                            <div>
                              <span className="font-medium">Title:</span> {(profileData as any).title}
                            </div>
                          )}
                          {(profileData as any)?.location && (
                            <div>
                              <span className="font-medium">Location:</span> {(profileData as any).location}
                            </div>
                          )}
                          {(profileData as any)?.skills && Array.isArray((profileData as any).skills) && (profileData as any).skills.length > 0 && (
                            <div>
                              <span className="font-medium">Skills:</span> {(profileData as any).skills.join(", ")}
                            </div>
                          )}
                          {(profileData as any)?.resumeUrl && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1 text-forest" />
                              <span className="font-medium">Resume:</span> Attached
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}