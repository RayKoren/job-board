import { 
  Briefcase, 
  Bolt, 
  Building, 
  ClipboardList 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonLink: string;
  imageSrc: string;
  imageAlt: string;
  buttonVariant?: "primary" | "secondary";
}

const ServiceCard = ({ 
  title, 
  description, 
  icon, 
  buttonText, 
  buttonLink, 
  imageSrc, 
  imageAlt,
  buttonVariant = "primary"
}: ServiceCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 hover:shadow-xl">
      <img 
        src={imageSrc} 
        alt={imageAlt} 
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex items-center mb-4">
          <span className="text-clay mr-3">{icon}</span>
          <h3 className="text-xl font-bold text-forest">{title}</h3>
        </div>
        <p className="text-brown mb-6">
          {description}
        </p>
        <Button 
          asChild
          className={`${buttonVariant === "primary" ? "bg-forest" : "bg-clay"} hover:bg-opacity-90 text-white font-medium px-6 py-2 rounded-lg transition duration-300`}
        >
          <a href={buttonLink}>{buttonText}</a>
        </Button>
      </div>
    </div>
  );
};

const Services = () => {
  const services = [
    {
      title: "Find a Job",
      description: "Browse full-time and part-time opportunities with Sheridan's best employers.",
      icon: <Briefcase className="h-5 w-5" />,
      buttonText: "Browse Jobs",
      buttonLink: "#",
      imageSrc: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      imageAlt: "Find a Job",
      buttonVariant: "primary" as const
    },
    {
      title: "Find a Gig",
      description: "Discover short-term work, freelance opportunities, and quick projects in Sheridan.",
      icon: <Bolt className="h-5 w-5" />,
      buttonText: "Explore Gigs",
      buttonLink: "#",
      imageSrc: "https://images.unsplash.com/photo-1498758536662-35b82cd15e29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      imageAlt: "Find a Gig",
      buttonVariant: "primary" as const
    },
    {
      title: "Post a Job",
      description: "Employers can post full-time or part-time positions to reach qualified local candidates.",
      icon: <Building className="h-5 w-5" />,
      buttonText: "Post Job",
      buttonLink: "#",
      imageSrc: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      imageAlt: "Post a Job",
      buttonVariant: "secondary" as const
    },
    {
      title: "Post a Gig",
      description: "Need temporary help? Post short-term projects and find skilled local talent.",
      icon: <ClipboardList className="h-5 w-5" />,
      buttonText: "Post Gig",
      buttonLink: "#",
      imageSrc: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
      imageAlt: "Post a Gig",
      buttonVariant: "secondary" as const
    }
  ];

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-forest mb-4">Our Services</h2>
          <p className="text-lg text-brown max-w-2xl mx-auto">
            Find the perfect opportunity or the ideal candidate with our simple, effective platform designed for the Sheridan community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <ServiceCard 
              key={index}
              title={service.title}
              description={service.description}
              icon={service.icon}
              buttonText={service.buttonText}
              buttonLink={service.buttonLink}
              imageSrc={service.imageSrc}
              imageAlt={service.imageAlt}
              buttonVariant={service.buttonVariant}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
