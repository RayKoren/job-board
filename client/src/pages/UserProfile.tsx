import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Mail, Settings } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface UserProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  mailingListConsent?: boolean;
}

export default function UserProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });

  const form = useForm({
    defaultValues: {
      mailingListConsent: userProfile?.mailingListConsent || false,
    },
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (userProfile) {
      form.reset({
        mailingListConsent: userProfile.mailingListConsent || false,
      });
    }
  }, [userProfile, form]);

  const updateConsentMutation = useMutation({
    mutationFn: async (consent: boolean) => {
      return apiRequest("PUT", "/api/auth/mailing-consent", { consent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Preferences updated",
        description: "Your mailing list preferences have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update preferences.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { mailingListConsent: boolean }) => {
    updateConsentMutation.mutate(data.mailingListConsent);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage/20 to-terracotta/20 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-forest" />
          <span className="text-forest">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage/20 to-terracotta/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Not signed in</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Please sign in to view your profile.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage/20 to-terracotta/20 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest mb-2">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-forest" />
                <CardTitle>Profile Information</CardTitle>
              </div>
              <CardDescription>
                Your account details and basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-sm text-gray-900">{userProfile.firstName || "Not set"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-sm text-gray-900">{userProfile.lastName || "Not set"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Account Type</label>
                <p className="text-sm text-gray-900 capitalize">
                  {userProfile.role === "job_seeker" ? "Job Seeker" : "Business"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Preferences - Only show for job seekers */}
          {userProfile.role === "job_seeker" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-forest" />
                  <CardTitle>Email Preferences</CardTitle>
                </div>
                <CardDescription>
                  Control what emails you receive from Sheridan Jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="mailingListConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Job alerts and updates
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Receive email notifications about new job opportunities, 
                              career tips, and platform updates. You can change this setting anytime.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-forest hover:bg-forest/90"
                        disabled={updateConsentMutation.isPending}
                      >
                        {updateConsentMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-forest" />
                <CardTitle>Account Actions</CardTitle>
              </div>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium">Password</h4>
                    <p className="text-xs text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
                
                {userProfile.role === "business" && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Business Profile</h4>
                      <p className="text-xs text-muted-foreground">
                        Update your company information
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </div>
                )}

                {userProfile.role === "job_seeker" && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium">Job Seeker Profile</h4>
                      <p className="text-xs text-muted-foreground">
                        Update your resume and preferences
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Profile
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}