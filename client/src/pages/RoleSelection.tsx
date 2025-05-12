import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { Building2, UserRound, Home } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RoleSelection() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRoleSelection = async (role: 'business' | 'job_seeker') => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/auth/select-role/${role}`);
      if (response.ok) {
        toast({
          title: "Role selected!",
          description: role === 'business' 
            ? "Welcome to your business account." 
            : "Welcome to your job seeker account."
        });
        
        setLocation(role === 'business' ? '/business/dashboard' : '/jobseeker/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to select role");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <Home className="h-5 w-5" />
            <span className="sr-only">Home</span>
          </Link>
        </Button>
      </div>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-forest">Welcome to Sheridan Jobs</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select your account type to get started
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>I am a...</CardTitle>
                <CardDescription>
                  Choose the account type that best fits your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRoleSelection('business')}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-forest/10 rounded-full p-3">
                      <Building2 className="h-6 w-6 text-forest" />
                    </div>
                    <div>
                      <h3 className="font-medium">Business</h3>
                      <p className="text-sm text-gray-500">Post jobs and find talented individuals</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRoleSelection('job_seeker')}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-forest/10 rounded-full p-3">
                      <UserRound className="h-6 w-6 text-forest" />
                    </div>
                    <div>
                      <h3 className="font-medium">Job Seeker</h3>
                      <p className="text-sm text-gray-500">Find jobs and apply to opportunities</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                {isLoading && (
                  <div className="animate-spin w-6 h-6 border-2 border-forest border-t-transparent rounded-full" />
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}