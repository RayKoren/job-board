import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: 'business' | 'job_seeker' | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: AuthUser | null;
  profile: any | null;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: data || null,
    profile: null, // Legacy compatibility
    isLoading,
    error,
    isAuthenticated: !!data,
    isBusinessUser: data?.role === 'business',
    isJobSeeker: data?.role === 'job_seeker',
  };
}