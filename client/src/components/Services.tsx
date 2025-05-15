import { Briefcase, Bolt, Building, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonLink: string;
  buttonVariant?: "primary" | "secondary";
}

const ServiceCard = ({
  title,
  description,
  icon,
  buttonText,
  buttonLink,
  buttonVariant = "primary",
}: ServiceCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg transition duration-300 hover:shadow-xl">
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`${buttonVariant === "primary" ? "bg-forest" : "bg-clay"} text-white p-4 rounded-full mb-4`}
          >
            {icon}
          </div>
          <h3 className="text-xl font-bold text-forest mb-2">{title}</h3>
        </div>
        <p className="text-brown mb-6 text-center">{description}</p>
        <Button
          asChild
          className={`${buttonVariant === "primary" ? "bg-forest" : "bg-clay"} hover:bg-opacity-90 text-white font-medium px-6 py-2 rounded-lg transition duration-300 w-full`}
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
      description:
        "Browse full-time and part-time opportunities with Sheridan's best employers.",
      icon: <Briefcase className="h-6 w-6" />,
      buttonText: "Browse Jobs",
      buttonLink: "/jobs",
      buttonVariant: "primary" as const,
    },
    {
      title: "Find a Gig",
      description:
        "Discover short-term work, freelance opportunities, and quick projects in Sheridan.",
      icon: <Bolt className="h-6 w-6" />,
      buttonText: "Explore Gigs",
      buttonLink: "/jobs",
      buttonVariant: "primary" as const,
    },
    {
      title: "Post a Job",
      description:
        "Sheridan Employers can post full-time or part-time positions to reach qualified local candidates.",
      icon: <Building className="h-6 w-6" />,
      buttonText: "Post Job",
      buttonLink: "/post-job",
      buttonVariant: "secondary" as const,
    },
    {
      title: "Post a Gig",
      description:
        "Need temporary help? Post short-term projects and find skilled local talent in Sheridan",
      icon: <ClipboardList className="h-6 w-6" />,
      buttonText: "Post Gig",
      buttonLink: "/post-job",
      buttonVariant: "secondary" as const,
    },
  ];

  return (
    <section id="services" className="py-20 bg-sand">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-forest mb-4">
            Our Services
          </h2>
          <p className="text-lg text-brown max-w-2xl mx-auto">
            Find the perfect opportunity or the ideal candidate with our simple,
            effective platform designed for the Sheridan community.
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
              buttonVariant={service.buttonVariant}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
