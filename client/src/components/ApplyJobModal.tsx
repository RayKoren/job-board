import { useState, useEffect } from 'react';
import { X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

// Define the job interface
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
}

// Define the form schema with Zod for validation
const applicationSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().min(10, {
    message: 'Please enter a valid phone number.',
  }),
  coverLetter: z.string().min(50, {
    message: 'Cover letter must be at least 50 characters.',
  }),
  resume: z.string().min(1, {
    message: 'Please provide a resume link or upload a file.',
  }),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions.',
  }),
});

type ApplicationValues = z.infer<typeof applicationSchema>;

interface ApplyJobModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplyJobModal({ job, isOpen, onClose }: ApplyJobModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isOpen) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for jobs.",
        variant: "destructive",
      });
      onClose();
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, isOpen, onClose, setLocation, toast]);
  
  // Initialize the form
  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      coverLetter: '',
      resume: '',
      agreeToTerms: false,
    },
  });
  
  // Handle form submission
  const onSubmit = async (data: ApplicationValues) => {
    // Double-check authentication before submitting
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to apply for jobs.",
        variant: "destructive",
      });
      onClose();
      setLocation('/login');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success message
      toast({
        title: 'Application Submitted!',
        description: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
      });
      
      // Close the modal
      onClose();
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while submitting your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-forest">
                  Apply for {job.title}
                </h2>
                <p className="text-gray-600">
                  {job.company} • {job.location}
                </p>
              </div>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0" 
                onClick={onClose}
              >
                <X />
              </Button>
            </div>
            
            {/* Application Form */}
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" {...field} />
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
                          <FormLabel>Phone Number*</FormLabel>
                          <FormControl>
                            <Input placeholder="Your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="resume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resume/CV*</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Link to your resume (Google Drive, Dropbox, etc.)" 
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Provide a link to your resume hosted online, or upload a file.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="coverLetter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Letter*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us why you're interested in this position and what makes you a good fit..." 
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the terms and conditions
                          </FormLabel>
                          <p className="text-sm text-gray-500">
                            By applying, you agree to our <a href="/terms" className="text-forest underline">Terms of Service</a> and <a href="/privacy" className="text-forest underline">Privacy Policy</a>.
                          </p>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-forest"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}