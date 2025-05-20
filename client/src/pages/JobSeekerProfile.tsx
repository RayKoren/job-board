import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, X, Link as LinkIcon, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  title: z.string().optional(),
  bio: z.string().optional(),
  skills: z.string().optional(), // Will be converted to array when submitting
  experience: z.string().optional(),
  education: z.string().optional(),
  resumeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function JobSeekerProfile() {
  const { isAuthenticated, isJobSeeker } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch existing profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/job-seeker/profile"],
    enabled: isAuthenticated && isJobSeeker,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      bio: "",
      skills: "",
      experience: "",
      education: "",
      resumeUrl: "",
      phone: "",
      location: "",
    },
  });

  // When profile data is loaded, update the form values
  // Using useEffect to avoid infinite re-renders
  useEffect(() => {
    if (profileData) {
      // Use type assertion to help TypeScript understand the structure
      const profile = profileData as any;
      form.reset({
        title: profile.title || "",
        bio: profile.bio || "",
        skills: profile.skills ? profile.skills.join(", ") : "",
        experience: profile.experience || "",
        education: profile.education || "",
        resumeUrl: profile.resumeUrl || "",
        phone: profile.phone || "",
        location: profile.location || "",
      });
    }
  }, [profileData, form]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF or DOC/DOCX)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Word document file (.pdf, .doc, .docx)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setResumeFile(file);
    }
  };
  
  // Handle resume upload (now directly to database)
  const uploadResume = async (): Promise<boolean> => {
    if (!resumeFile) return false;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FormData object to send the file
      const formData = new FormData();
      formData.append('resume', resumeFile);
      
      // Upload the file using fetch with progress reporting
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/resume-upload', true);
      
      // Setup progress monitoring
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      
      // Create a promise to handle the upload
      const uploadPromise = new Promise<boolean>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            // Resume is now stored in database, not as a URL
            resolve(true);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
      });
      
      xhr.send(formData);
      await uploadPromise;
      
      // Return success
      return true;
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload your resume. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle resume removal
  const handleRemoveResume = () => {
    setResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Upload resume directly to the database if one is selected
      if (resumeFile) {
        await uploadResume();
        // Resume data is now stored directly in the database associated with the user,
        // so we don't need to track the URL in the form data
      }
      
      // Convert comma-separated skills to array
      const skills = data.skills
        ? data.skills.split(",").map(skill => skill.trim()).filter(skill => skill)
        : [];
      
      await apiRequest("POST", "/api/job-seeker/profile", {
        ...data,
        skills,
        // No need to include resumeUrl anymore as it's handled separately
      });
      
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["/api/job-seeker/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your job seeker profile has been updated successfully.",
      });
      
      // Clear the resume file state after successful submission
      setResumeFile(null);
    } catch (error) {
      console.error("Error updating job seeker profile:", error);
      toast({
        title: "Error",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !isJobSeeker) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-forest mb-4">Job Seeker Profile</h1>
        <p className="text-lg text-gray-600 mb-8">
          You need to be logged in as a job seeker to access this page.
        </p>
        <Button asChild>
          <a href="/api/login?role=job_seeker">Log in as Job Seeker</a>
        </Button>
      </div>
    );
  }

  // Handle going back to dashboard
  const handleBack = () => {
    navigate('/jobseeker/dashboard');
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-forest mb-2">Job Seeker Profile</h1>
          <p className="text-lg text-gray-600">
            Complete your profile to make it easier to apply for jobs and be discovered by employers.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
          Back to Dashboard
        </Button>
      </div>

      {isLoadingProfile ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-forest animate-spin" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Software Engineer, Marketing Specialist, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sheridan, WY" />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Tell employers about yourself..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter skills separated by commas (e.g. JavaScript, Excel, Customer Service)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Experience</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe your relevant work experience..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Describe your educational background..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <h3 className="text-lg font-medium">Resume</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload your resume to make it easier for employers to review your qualifications.
                Your resume will be stored securely in our database.
              </p>
              
              <div className="mt-4">
                <Label htmlFor="resume-upload">Resume Upload</Label>
                <div className="mt-2">
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="sr-only"
                  />
                  
                  {!resumeFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-forest transition-colors">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mx-auto"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Resume
                      </Button>
                      <p className="mt-2 text-sm text-gray-500">
                        PDF or Word Document, max 5MB
                      </p>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-forest mr-2" />
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{resumeFile.name}</p>
                            <p className="text-sm text-gray-500">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveResume}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-forest transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-center mt-1">Uploading: {uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
              
              {profileData && ((profileData as any).resumeName || (profileData as any).resumeData) && (
                <div className="mt-4">
                  <Label>Current Resume</Label>
                  <div className="mt-2 flex items-center">
                    <FileText className="h-5 w-5 text-forest mr-2" />
                    <a 
                      href={`/api/resume/${(profileData as any).userId}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-forest hover:underline flex items-center"
                    >
                      View Current Resume: {(profileData as any).resumeName || "Resume"} <LinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {profileData ? "Update Profile" : "Create Profile"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}