import { useState } from "react";
import { Briefcase, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface RoleSelectionProps {
  onRoleSelected?: () => void;
}

export function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectRole = async (role: 'business' | 'job_seeker') => {
    setIsLoading(true);

    try {
      await apiRequest('GET', `/api/auth/select-role/${role}`);
      
      // Invalidate user query to reflect new role
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: 'Role selected',
        description: `You've successfully selected the ${role === 'business' ? 'Business' : 'Job Seeker'} role.`,
      });
      
      if (onRoleSelected) {
        onRoleSelected();
      }
    } catch (error) {
      console.error('Error selecting role:', error);
      toast({
        title: 'Error',
        description: 'Failed to select role. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-forest mb-4 text-center">Welcome to Sheridan Jobs</h2>
        <p className="text-lg text-gray-600 mb-6 text-center">
          Please select your account type to continue
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => selectRole('business')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-6 border-2 border-clay hover:border-forest rounded-lg transition-colors"
          >
            <Briefcase className="w-16 h-16 text-clay mb-4" />
            <h3 className="text-xl font-semibold text-clay">Business</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Post jobs and find talented employees
            </p>
          </button>
          
          <button
            onClick={() => selectRole('job_seeker')}
            disabled={isLoading}
            className="flex flex-col items-center justify-center p-6 border-2 border-clay hover:border-forest rounded-lg transition-colors"
          >
            <UserCircle className="w-16 h-16 text-clay mb-4" />
            <h3 className="text-xl font-semibold text-clay">Job Seeker</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Browse and apply to jobs in Sheridan
            </p>
          </button>
        </div>
        
        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-clay border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}