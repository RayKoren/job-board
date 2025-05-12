import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Info, X } from "lucide-react";

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
import { useToast } from "@/hooks/use-toast";

// Define the form schema with Zod for validation
const formSchema = z.object({
  jobTitle: z.string().min(2, {
    message: "Job title must be at least 2 characters.",
  }).max(100, {
    message: "Job title cannot exceed 100 characters."
  }),
  companyName: z.string().min(2, {
    message: "Company name must be at least 2 characters."
  }),
  location: z.string().min(2, {
    message: "Location is required."
  }),
  jobType: z.enum(["full-time", "part-time", "contract", "gig", "internship"], {
    message: "Please select a valid job type."
  }),
  salary: z.string().optional(),
  description: z.string().min(50, {
    message: "Description must be at least 50 characters long."
  }),
  requirements: z.string().optional(),
  applicationEmail: z.string().email({
    message: "Please enter a valid email address."
  }),
  applicationUrl: z.string().url({
    message: "Please enter a valid URL."
  }).optional(),
  contactPhone: z.string().optional(),
  plan: z.enum(["basic", "standard", "featured", "unlimited"], {
    message: "Please select a plan."
  }),
  addons: z.array(z.string()).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions."
  })
});

type FormValues = z.infer<typeof formSchema>;

export default function PostJob() {
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      location: "Sheridan, WY",
      jobType: "full-time",
      salary: "",
      description: "",
      requirements: "",
      applicationEmail: "",
      applicationUrl: "",
      contactPhone: "",
      plan: "standard",
      addons: [],
      agreeToTerms: false
    },
  });

  // Calculate price based on selected plan and addons
  const calculatePrice = () => {
    let basePrice = 0;
    
    // Calculate base price from plan
    switch(selectedPlan) {
      case "basic":
        basePrice = 0;
        break;
      case "standard":
        basePrice = 20;
        break;
      case "featured":
        basePrice = 50;
        break;
      case "unlimited":
        basePrice = 150;
        break;
      default:
        basePrice = 0;
    }
    
    // Add prices of selected addons
    let addonPrice = 0;
    if(selectedAddons.includes("extend")) addonPrice += 5;
    if(selectedAddons.includes("social")) addonPrice += 15;
    if(selectedAddons.includes("banner")) addonPrice += 25;
    
    return {
      basePrice,
      addonPrice,
      totalPrice: basePrice + addonPrice
    };
  };

  const { basePrice, addonPrice, totalPrice } = calculatePrice();

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    console.log(data);
    // Here you would typically send the data to an API endpoint
    
    // Show success message
    toast({
      title: "Job posting created!",
      description: "Your job has been submitted successfully.",
    });
    
    // Redirect to a thank you page or home
    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  const handlePlanChange = (value: string) => {
    setSelectedPlan(value);
    form.setValue("plan", value as any);
  };

  const handleAddonToggle = (addon: string) => {
    let newAddons;
    if (selectedAddons.includes(addon)) {
      newAddons = selectedAddons.filter(a => a !== addon);
    } else {
      newAddons = [...selectedAddons, addon];
    }
    setSelectedAddons(newAddons);
    form.setValue("addons", newAddons);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <header className="pt-28 pb-8 bg-forest text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Post a Job</h1>
        <p className="text-xl max-w-2xl mx-auto px-4">
          Connect with talent in Sheridan County by posting your job listing
        </p>
      </header>
      
      <main className="flex-grow py-12 bg-sand">
        <div className="container mx-auto px-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main form column */}
                <div className="lg:col-span-2 space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Details</CardTitle>
                      <CardDescription>
                        Tell job seekers about the position
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="jobTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title*</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Marketing Manager" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name*</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Sheridan Enterprises" {...field} />
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
                                <Input placeholder="e.g. Sheridan, WY" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="jobType"
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
                                  <SelectItem value="full-time">Full-time</SelectItem>
                                  <SelectItem value="part-time">Part-time</SelectItem>
                                  <SelectItem value="contract">Contract</SelectItem>
                                  <SelectItem value="gig">Gig</SelectItem>
                                  <SelectItem value="internship">Internship</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salary (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. $50,000 - $70,000" {...field} />
                              </FormControl>
                              <FormDescription>
                                Adding a salary range can increase visibility
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Description*</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the responsibilities, benefits, and company culture..." 
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Requirements (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List required qualifications, experience, skills..." 
                                className="min-h-24"
                                {...field}
                              />
                            </FormControl>
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
                        How should candidates apply for this job?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="applicationEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Email*</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="e.g. careers@company.com" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="applicationUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Application URL (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g. https://company.com/careers" 
                                  {...field}
                                />
                              </FormControl>
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
                                <Input placeholder="e.g. (307) 555-1234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                        <div 
                          className={`relative p-4 rounded-lg border-2 cursor-pointer ${selectedPlan === 'basic' ? 'border-forest bg-white' : 'border-gray-200 bg-gray-50'}`}
                          onClick={() => handlePlanChange('basic')}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">Basic</h4>
                              <p className="text-sm text-gray-500">7-day listing</p>
                            </div>
                            <div className="text-xl font-bold">Free</div>
                          </div>
                          {selectedPlan === 'basic' && (
                            <div className="absolute top-2 right-2 text-forest">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className={`relative p-4 rounded-lg border-2 cursor-pointer ${selectedPlan === 'standard' ? 'border-forest bg-white' : 'border-gray-200 bg-gray-50'}`}
                          onClick={() => handlePlanChange('standard')}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">Standard</h4>
                              <p className="text-sm text-gray-500">14-day listing + logo</p>
                            </div>
                            <div className="text-xl font-bold">$20</div>
                          </div>
                          {selectedPlan === 'standard' && (
                            <div className="absolute top-2 right-2 text-forest">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className={`relative p-4 rounded-lg border-2 cursor-pointer ${selectedPlan === 'featured' ? 'border-forest bg-white' : 'border-gray-200 bg-gray-50'}`}
                          onClick={() => handlePlanChange('featured')}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">Featured</h4>
                              <p className="text-sm text-gray-500">30-day premium listing</p>
                            </div>
                            <div className="text-xl font-bold">$50</div>
                          </div>
                          {selectedPlan === 'featured' && (
                            <div className="absolute top-2 right-2 text-forest">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        
                        <div 
                          className={`relative p-4 rounded-lg border-2 cursor-pointer ${selectedPlan === 'unlimited' ? 'border-forest bg-white' : 'border-gray-200 bg-gray-50'}`}
                          onClick={() => handlePlanChange('unlimited')}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold">Unlimited</h4>
                              <p className="text-sm text-gray-500">Unlimited posts for 30 days</p>
                            </div>
                            <div className="text-xl font-bold">$150</div>
                          </div>
                          {selectedPlan === 'unlimited' && (
                            <div className="absolute top-2 right-2 text-forest">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Add-ons</CardTitle>
                        <CardDescription>
                          Enhance your job posting visibility
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="extend" 
                            checked={selectedAddons.includes('extend')}
                            onCheckedChange={() => handleAddonToggle('extend')}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="extend"
                              className="flex justify-between font-medium cursor-pointer"
                            >
                              <span>Extend Post</span>
                              <span>+$5</span>
                            </Label>
                            <p className="text-sm text-gray-500">Add 7 more days to your listing</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="social" 
                            checked={selectedAddons.includes('social')}
                            onCheckedChange={() => handleAddonToggle('social')}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="social"
                              className="flex justify-between font-medium cursor-pointer"
                            >
                              <span>Social Media Boost</span>
                              <span>+$15</span>
                            </Label>
                            <p className="text-sm text-gray-500">Promote on our social channels</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="banner" 
                            checked={selectedAddons.includes('banner')}
                            onCheckedChange={() => handleAddonToggle('banner')}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor="banner"
                              className="flex justify-between font-medium cursor-pointer"
                            >
                              <span>Priority Banner</span>
                              <span>+$25</span>
                            </Label>
                            <p className="text-sm text-gray-500">Featured on homepage for 3 days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Base Plan</span>
                          <span>${basePrice}</span>
                        </div>
                        
                        {addonPrice > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Add-ons</span>
                            <span>+${addonPrice}</span>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t flex justify-between font-semibold">
                          <span>Total</span>
                          <span>${totalPrice}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex items-start space-x-3">
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
                            <FormDescription>
                              By posting this job, you agree to our <a href="#" className="underline text-forest">Terms of Service</a> and <a href="#" className="underline text-forest">Privacy Policy</a>.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full bg-forest hover:bg-forest/90">
                      Post Job
                    </Button>
                  </div>
                </div>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq">
                  <AccordionTrigger className="text-forest">Frequently Asked Questions</AccordionTrigger>
                  <AccordionContent className="space-y-4 text-gray-700">
                    <div>
                      <h4 className="font-semibold">How long will my job posting be visible?</h4>
                      <p className="text-sm">The visibility duration depends on your selected plan. Basic: 7 days, Standard: 14 days, Featured: 30 days, Unlimited: 30 days with unlimited job postings.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Can I edit my job posting after submission?</h4>
                      <p className="text-sm">Yes, you can edit your job posting at any time during its active period by logging into your account.</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">How do I receive applications?</h4>
                      <p className="text-sm">Applications will be sent directly to the email address you provide. You can also specify an application URL if you prefer candidates to apply through your website.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </form>
          </Form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}