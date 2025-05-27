import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>();
  
  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for your message! We'll get back to you soon.",
      });
      reset(); // Clear the form
    },
    onError: (error: any) => {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Sorry, there was an error sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    contactMutation.mutate(data);
  };

  return (
    <section id="contact" className="py-20 bg-white bg-opacity-90">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-forest mb-6 relative">
              Get In Touch
              <span className="absolute bottom-0 left-0 w-20 h-1 bg-clay"></span>
            </h2>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              Have questions about posting a job or finding work in Sheridan?
              Reach out to our team and we'll be happy to help.
            </p>

            <div className="space-y-6 mb-8">
              <div className="flex items-start">
                <div className="bg-forest text-white p-3 rounded-full mr-4">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-forest">Location</h3>
                  <p className="text-brown">Main Street, Sheridan, WY 82801</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-forest text-white p-3 rounded-full mr-4">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-forest">Phone</h3>
                  <p className="text-brown">(307) 555-1234</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-forest text-white p-3 rounded-full mr-4">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-forest">Email</h3>
                  <p className="text-brown">info@sheridanjobs.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-forest mb-6">
                Send Us a Message
              </h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <Label htmlFor="name" className="text-brown font-medium mb-2">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clay focus:border-clay outline-none transition"
                    placeholder="John Doe"
                    {...register("name", { required: "Name is required" })}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Label
                    htmlFor="email"
                    className="text-brown font-medium mb-2"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clay focus:border-clay outline-none transition"
                    placeholder="john@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <Label
                    htmlFor="subject"
                    className="text-brown font-medium mb-2"
                  >
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clay focus:border-clay outline-none transition"
                    placeholder="Job Posting Question"
                    {...register("subject", {
                      required: "Subject is required",
                    })}
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <Label
                    htmlFor="message"
                    className="text-brown font-medium mb-2"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-clay focus:border-clay outline-none transition"
                    placeholder="Your message here..."
                    {...register("message", {
                      required: "Message is required",
                      minLength: {
                        value: 10,
                        message: "Message must be at least 10 characters long"
                      }
                    })}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={contactMutation.isPending}
                  className="w-full bg-clay hover:bg-opacity-90 text-white font-medium px-6 py-3 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                >
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
