import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { RoleSelection } from "@/components/RoleSelection";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // If user is authenticated but has no role selected, show role selection
  const needsRoleSelection = isAuthenticated && user && !user.role;

  // Mark initial load as complete after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoadComplete(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading indicator only during initial load
  if (isLoading && !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-forest border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (needsRoleSelection || showRoleSelection) {
    return <RoleSelection onRoleSelected={() => setShowRoleSelection(false)} />;
  }
  
  return <>{children}</>;
}

export function LoginButton() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await apiRequest("GET", "/api/logout", undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        {user.profileImageUrl && (
          <img 
            src={user.profileImageUrl} 
            alt="Profile" 
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div className="hidden md:block">
          <p className="text-sm font-medium text-forest">
            {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email || 'User'}
          </p>
          <p className="text-xs text-gray-500">
            {user.role === 'business' ? 'Business Account' : 'Job Seeker'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    );
  }
  
  return (
    <Button variant="default" size="sm" onClick={() => navigate("/login")} className="flex items-center gap-2">
      <LogIn className="w-4 h-4" />
      <span>Login</span>
    </Button>
  );
}

export function AccountTypeButton() {
  const { isAuthenticated, user, isBusinessUser, isJobSeeker } = useAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  if (!isAuthenticated) {
    return null;
  }
  
  if (showRoleSelection) {
    return <RoleSelection onRoleSelected={() => setShowRoleSelection(false)} />;
  }
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={() => setShowRoleSelection(true)}
      className="text-sm"
    >
      {isBusinessUser ? 'Switch to Job Seeker' : isJobSeeker ? 'Switch to Business' : 'Select Account Type'}
    </Button>
  );
}