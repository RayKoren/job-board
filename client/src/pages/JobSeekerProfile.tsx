import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

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
  if (profileData && !form.formState.isDirty) {
    form.reset({
      title: profileData.title || "",
      bio: profileData.bio || "",
      skills: profileData.skills ? profileData.skills.join(", ") : "",
      experience: profileData.experience || "",
      education: profileData.education || "",
      resumeUrl: profileData.resumeUrl || "",
      phone: profileData.phone || "",
      location: profileData.location || "",
    });
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Convert comma-separated skills to array
      const skills = data.skills
        ? data.skills.split(",").map(skill => skill.trim()).filter(skill => skill)
        : [];
      
      await apiRequest("POST", "/api/job-seeker/profile", {
        ...data,
        skills,
      });
      
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["/api/job-seeker/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your job seeker profile has been updated successfully.",
      });
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

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-forest mb-4">Job Seeker Profile</h1>
      <p className="text-lg text-gray-600 mb-8">
        Complete your profile to make it easier to apply for jobs and be discovered by employers.
      </p>

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

            <FormField
              control={form.control}
              name="resumeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Link to your resume (Google Drive, Dropbox, etc.)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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