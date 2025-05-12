import { useQuery } from "@tanstack/react-query";

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
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
    isBusinessUser: data?.user?.role === 'business',
    isJobSeeker: data?.user?.role === 'job_seeker',
  };
}