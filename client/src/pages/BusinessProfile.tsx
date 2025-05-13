import React, { useState, useEffect } from "react";
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
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().optional(),
  location: z.string().optional(),
  website: z.string()
    .transform(val => {
      // If empty string, return it as is
      if (!val) return val;
      // If it doesn't have a protocol, add http://
      if (!/^(?:https?:\/\/|ftp:\/\/|mailto:|tel:)/i.test(val)) {
        return `http://${val}`;
      }
      return val;
    })
    .refine(val => {
      if (!val) return true; // Empty string is allowed
      try {
        new URL(val);
        return true;
      } catch (e) {
        return false;
      }
    }, "Must be a valid URL")
    .optional()
    .or(z.literal("")),
  description: z.string().optional(),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessProfile() {
  const { isAuthenticated, isBusinessUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Define business profile interface
  interface BusinessProfile {
    companyName: string;
    industry?: string;
    location?: string;
    website?: string;
    description?: string;
    contactPhone?: string;
  }

  // Fetch existing profile data
  const { data: profileData, isLoading: isLoadingProfile } = useQuery<BusinessProfile>({
    queryKey: ["/api/business/profile"],
    enabled: isAuthenticated && isBusinessUser,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      location: "",
      website: "",
      description: "",
      phone: "",
    },
  });

  // When profile data is loaded, update the form values
  useEffect(() => {
    if (profileData && !form.formState.isDirty) {
      form.reset({
        companyName: profileData.companyName || "",
        industry: profileData.industry || "",
        location: profileData.location || "",
        website: profileData.website || "",
        description: profileData.description || "",
        phone: profileData.contactPhone || "",
      });
    }
  }, [profileData, form.formState.isDirty, form.reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    // Process website URL to ensure it has a protocol
    if (data.website) {
      // If website doesn't start with a protocol (http://, https://, etc.)
      if (!/^(?:https?:\/\/|ftp:\/\/|mailto:|tel:)/i.test(data.website)) {
        // Add http:// prefix
        data.website = `http://${data.website}`;
      }
    }
    
    try {
      await apiRequest("POST", "/api/business/profile", data);
      
      // Invalidate the profile query to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ["/api/business/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating business profile:", error);
      toast({
        title: "Error",
        description: "Could not update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !isBusinessUser) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-forest mb-4">Business Profile</h1>
        <p className="text-lg text-gray-600 mb-8">
          You need to be logged in as a business user to access this page.
        </p>
        <Button asChild>
          <a href="/api/login?role=business">Log in as Business</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-forest mb-4">Business Profile</h1>
      <p className="text-lg text-gray-600 mb-8">
        Complete your business profile to start posting jobs on Sheridan Jobs.
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
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sheridan, WY" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder="Tell job seekers about your company..."
                    />
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