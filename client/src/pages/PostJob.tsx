import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Info, X, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Define the form schema with Zod for validation
const formSchema = z.object({
  title: z
    .string()
    .min(5, {
      message: "Job title must be at least 5 characters.",
    })
    .max(100, {
      message: "Job title must not exceed 100 characters.",
    }),
  company: z
    .string()
    .min(2, {
      message: "Company name must be at least 2 characters.",
    })
    .max(100, {
      message: "Company name must not exceed 100 characters.",
    }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  description: z
    .string()
    .min(50, {
      message: "Job description must be at least 50 characters.",
    })
    .max(5000, {
      message: "Job description must not exceed 5000 characters.",
    }),
  requirements: z
    .string()
    .min(30, {
      message: "Job requirements must be at least 30 characters.",
    })
    .max(2000, {
      message: "Job requirements must not exceed 2000 characters.",
    }),
  benefits: z.string().optional(),
  type: z.string({
    required_error: "Please select a job type.",
  }),
  compensationType: z.string({
    required_error: "Please select the compensation type.",
  }),
  salaryRange: z.string().optional(),
  hourlyRate: z.string().optional(),
  contactEmail: z
    .string()
    .email({
      message: "Please enter a valid email address.",
    })
    .optional(),
  applicationUrl: z
    .string()
    .transform(val => {
      // If empty string, return it as is
      if (!val || val.trim() === '') return '';
      
      // If it doesn't have a protocol, add http://
      if (!/^(?:https?:\/\/|ftp:\/\/|mailto:|tel:)/i.test(val)) {
        return `http://${val.trim()}`;
      }
      return val.trim();
    })
    .refine(val => {
      if (!val || val === '') return true; // Empty string is allowed
      
      // Simple validation - just check if it looks like a URL after transformation
      try {
        // We rely on the transform above to add http:// if needed
        return true;
      } catch (e) {
        return false;
      }
    }, "Please enter a valid URL.")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional(),
  plan: z.enum(["basic", "standard", "featured", "unlimited"], {
    message: "Please select a plan.",
  }),
  addons: z.array(z.string()).optional(),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function PostJob() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("standard");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for pricing data
  const [pricingData, setPricingData] = useState<{
    plans: Record<string, any>,
    addons: Record<string, any>
  } | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  // Fetch pricing data from API
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        setLoadingPricing(true);
        const response = await fetch('/api/pricing');
        
        if (!response.ok) {
          throw new Error(`Error fetching pricing data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched pricing data:", data);
        setPricingData(data);
        
        // If the previously selected plan is inactive or unavailable, select a default
        if (data.plans && !data.plans[selectedPlan]) {
          if (data.plans.standard) {
            setSelectedPlan('standard');
          } else if (Object.keys(data.plans).length > 0) {
            setSelectedPlan(Object.keys(data.plans)[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pricing data:', err);
        toast({
          variant: 'destructive',
          title: 'Error Loading Pricing',
          description: 'Failed to load pricing information. Please try again later.'
        });
      } finally {
        setLoadingPricing(false);
      }
    };
    
    fetchPricingData();
  }, [toast]);
  
  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a job.",
        variant: "destructive",
      });
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation, toast]);

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      description: "",
      requirements: "",
      benefits: "",
      type: "",
      compensationType: "",
      salaryRange: "",
      hourlyRate: "",
      contactEmail: "",
      applicationUrl: "",
      contactPhone: "",
      plan: "standard",
      addons: [],
      agreeToTerms: false,
    },
  });

  // Update form value when plan changes
  useEffect(() => {
    form.setValue("plan", selectedPlan);
  }, [selectedPlan, form]);

  // Update form value when addons change
  useEffect(() => {
    form.setValue("addons", selectedAddons);
  }, [selectedAddons, form]);

  // Toggle addon selection
  const toggleAddon = (addon: string) => {
    if (selectedAddons.includes(addon)) {
      setSelectedAddons(selectedAddons.filter((a) => a !== addon));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  // Handle plan selection
  const handlePlanChange = (plan: string) => {
    if (pricingData?.plans && pricingData.plans[plan]) {
      setSelectedPlan(plan);
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    // Make a copy of the data so we can modify it
    const submissionData = { ...data };
    
    // Process application URL to ensure it has a protocol
    if (submissionData.applicationUrl && submissionData.applicationUrl.trim() !== '') {
      // If application URL doesn't start with a protocol (http://, https://, etc.)
      if (!/^(?:https?:\/\/|ftp:\/\/|mailto:|tel:)/i.test(submissionData.applicationUrl)) {
        // Add http:// prefix
        submissionData.applicationUrl = `http://${submissionData.applicationUrl}`;
      }
    }
    
    console.log("Form submitted:", submissionData);
    
    try {
      // Check if this is a paid plan (anything except 'basic')
      if (submissionData.plan !== 'basic') {
        // For paid plans, redirect to payment page with job data
        const jobDataParam = encodeURIComponent(JSON.stringify(submissionData));
        
        // Map addons to ensure consistent naming with the server
        const mappedAddons = submissionData.addons ? submissionData.addons.map(addon => {
          // Map social-boost to social-media-promotion to match server naming
          if (addon === 'social-boost') return 'social-media-promotion';
          return addon;
        }) : [];
        
        const addonParam = mappedAddons.length > 0 
          ? encodeURIComponent(JSON.stringify(mappedAddons)) 
          : '';
        
        // Redirect to payment page
        setLocation(`/payment?plan=${submissionData.plan}&addons=${addonParam}&jobData=${jobDataParam}`);
        return;
      }
      
      // Only proceed with immediate job posting for free 'basic' plan
      // Send the job post data to the server
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to post job');
      }
      
      toast({
        title: "Job Posted Successfully!",
        description: "Your job has been posted and is now live.",
      });
      
      // Redirect to business dashboard
      setLocation("/business/dashboard");
    } catch (error) {
      console.error('Error posting job:', error);
      toast({
        title: "Error",
        description: "There was a problem posting your job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate total price from API data
  const getPlanPrice = () => {
    if (!pricingData || !pricingData.plans || !pricingData.plans[selectedPlan]) {
      return 0;
    }
    return pricingData.plans[selectedPlan].price || 0;
  };

  const getAddonPrice = (addon: string) => {
    if (!pricingData || !pricingData.addons || !pricingData.addons[addon]) {
      return 0;
    }
    return pricingData.addons[addon].price || 0;
  };

  const totalPrice = () => {
    const planPrice = getPlanPrice();
    const addonsPrice = selectedAddons.reduce(
      (sum, addon) => sum + getAddonPrice(addon),
      0
    );
    return planPrice + addonsPrice;
  };

  // Return early with a loading state when checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated and not loading, the useEffect will handle redirect
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center space-y-4 max-w-md p-8">
          <LogIn className="w-12 h-12 mx-auto text-forest" />
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-gray-600">
            You need to be logged in to post a job. Redirecting to login page...
          </p>
          <Button onClick={() => setLocation('/login')}>Login Now</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-forest">Post a Job</h1>
              <p className="text-gray-600 max-w-3xl mt-2">
                Connect with talented individuals in the Sheridan area. Complete
                the form below to list your job opening.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main form content */}
                  <div className="lg:col-span-2 space-y-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Job Details</CardTitle>
                        <CardDescription>
                          Provide information about the position
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Title*</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Senior Developer" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name*</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Acme Corporation"
                                  {...field}
                                />
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
                              <FormLabel>Location*</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. Sheridan, WY or Remote"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Type*</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select job type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="full-time">
                                      Full-time
                                    </SelectItem>
                                    <SelectItem value="part-time">
                                      Part-time
                                    </SelectItem>
                                    <SelectItem value="contract">
                                      Contract
                                    </SelectItem>
                                    <SelectItem value="gig">Gig</SelectItem>
                                    <SelectItem value="internship">
                                      Internship
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="compensationType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Compensation Type*</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="salary">
                                      Annual Salary
                                    </SelectItem>
                                    <SelectItem value="hourly">
                                      Hourly Rate
                                    </SelectItem>
                                    <SelectItem value="contract">
                                      Contract Amount
                                    </SelectItem>
                                    <SelectItem value="undisclosed">
                                      Undisclosed
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch("compensationType") === "salary" && (
                          <FormField
                            control={form.control}
                            name="salaryRange"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Salary Range</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. $50,000 - $70,000"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Providing a salary range can increase
                                  applications by up to 30%
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch("compensationType") === "hourly" && (
                          <FormField
                            control={form.control}
                            name="hourlyRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hourly Rate</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. $15 - $25 per hour"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Description*</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe the responsibilities, qualifications, and other details about the position..."
                                  className="min-h-[150px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Be specific about day-to-day responsibilities and
                                expectations.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="requirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Requirements*</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List the skills, experience, and qualifications needed..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="benefits"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Benefits & Perks</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe any benefits, perks, or other incentives..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Highlighting benefits can make your job posting
                                more attractive.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Application Details</CardTitle>
                        <CardDescription>
                          How should candidates apply for this position?
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. jobs@company.com"
                                  type="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="applicationUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Application URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. company.com/careers"
                                  type="text"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                External link where candidates can apply. You can enter just the domain (e.g., company.com/careers) without http://.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. (307) 555-1234"
                                  type="tel"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar: Pricing details */}
                  <div>
                    <div className="space-y-6 sticky top-24">
                      <Card>
                        <CardHeader>
                          <CardTitle>Select Your Plan</CardTitle>
                          <CardDescription>
                            Choose the best plan for your needs
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {loadingPricing ? (
                            // Loading state
                            <div className="space-y-4">
                              <div className="border-2 border-gray-200 p-4 rounded-lg animate-pulse">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="w-1/2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                                  </div>
                                  <div className="w-1/4 h-6 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                              <div className="border-2 border-gray-200 p-4 rounded-lg animate-pulse">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="w-1/2">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                                  </div>
                                  <div className="w-1/4 h-6 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            </div>
                          ) : pricingData && Object.keys(pricingData.plans).length > 0 ? (
                            // Render plans dynamically
                            Object.entries(pricingData.plans).map(([planCode, plan]) => (
                              <div
                                key={planCode}
                                className={`relative p-4 rounded-lg border-2 cursor-pointer ${
                                  selectedPlan === planCode ? "border-forest bg-white" : "border-gray-200 bg-gray-50"
                                }`}
                                onClick={() => handlePlanChange(planCode)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <h4 className="font-semibold">{plan.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {plan.duration ? (plan.duration.split('job listing')[0] || '').trim() : ''}
                                    </p>
                                  </div>
                                  <div className="text-xl font-bold">{plan.price > 0 ? `$${plan.price}` : 'Free'}</div>
                                </div>
                                
                                {/* Show features if available */}
                                {plan.features && plan.features.length > 0 && (
                                  <div className="mt-2 text-sm text-forest">
                                    {plan.features.slice(0, 3).map((feature, index) => (
                                      <span key={index} className="flex items-center gap-1">
                                        <Check className="w-4 h-4" /> {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                
                                {selectedPlan === planCode && (
                                  <div className="absolute top-2 right-2 text-forest">
                                    <Check className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            // No plans available state
                            <div className="text-center p-6 border-2 border-gray-200 rounded-lg">
                              <p className="text-gray-500">No pricing plans available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Add-ons</CardTitle>
                          <CardDescription>
                            Enhance your job listing with these options
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {loadingPricing ? (
                            // Loading state for add-ons
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2 animate-pulse">
                                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                <div className="grid gap-1.5 w-full">
                                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 animate-pulse">
                                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                <div className="grid gap-1.5 w-full">
                                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </div>
                            </div>
                          ) : pricingData && Object.keys(pricingData.addons).length > 0 ? (
                            // Render add-ons dynamically
                            Object.entries(pricingData.addons).map(([addonCode, addon]) => (
                              <div key={addonCode} className="flex items-center space-x-2">
                                <Checkbox
                                  id={addonCode}
                                  checked={selectedAddons.includes(addonCode)}
                                  onCheckedChange={() => toggleAddon(addonCode)}
                                />
                                <div className="grid gap-1.5">
                                  <Label
                                    htmlFor={addonCode}
                                    className="font-medium"
                                  >
                                    {addon.name} (+${addon.price})
                                  </Label>
                                  <p className="text-sm text-gray-500">
                                    {addon.description}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            // No add-ons available state
                            <div className="text-center p-4">
                              <p className="text-gray-500">No add-ons available</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between">
                            <span>
                              {selectedPlan.charAt(0).toUpperCase() +
                                selectedPlan.slice(1)}{" "}
                              Plan
                            </span>
                            <span>${getPlanPrice()}</span>
                          </div>

                          {selectedAddons.map((addon) => (
                            <div key={addon} className="flex justify-between">
                              <span>
                                {addon
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </span>
                              <span>${getAddonPrice(addon)}</span>
                            </div>
                          ))}

                          <div className="pt-4 border-t border-gray-200 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${totalPrice()}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
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
                                    I agree to the{" "}
                                    <a
                                      href="/terms"
                                      className="text-forest underline"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      terms and conditions
                                    </a>
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full">
                            {totalPrice() > 0
                              ? "Continue to Payment"
                              : "Post Job for Free"}
                          </Button>

                          <div className="text-xs text-gray-500 text-center flex items-center gap-1 justify-center">
                            <Info className="w-4 h-4" />
                            <span>
                              Your job will be reviewed before being published
                            </span>
                          </div>
                        </CardFooter>
                      </Card>
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}