import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus } from "lucide-react";
import { Link } from "wouter";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-forest">Sheridan Jobs</h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect with local businesses and job opportunities in Sheridan, Wyoming
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Sheridan Jobs</CardTitle>
                <CardDescription>
                  Choose an option to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full flex items-center justify-center gap-2" asChild>
                  <a href="/api/login?newUser=true">
                    <UserPlus className="h-5 w-5" />
                    Create Account
                  </a>
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full flex items-center justify-center gap-2" asChild>
                  <a href="/api/login">
                    <LogIn className="h-5 w-5" />
                    Log In
                  </a>
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col">
                <p className="text-xs text-center text-muted-foreground mt-2">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}