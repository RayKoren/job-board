import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: data?.user,
    profile: data?.profile,
    isLoading,
    error,
    isAuthenticated: !!data?.user,
    isBusinessUser: data?.user?.role === 'business',
    isJobSeeker: data?.user?.role === 'job_seeker',
  };
}