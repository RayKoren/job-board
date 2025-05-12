import { 
  MapPin, 
  DollarSign, 
  ArrowRight,
  Bookmark 
} from "lucide-react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  type: "Full-time" | "Part-time" | "Gig";
}

const JobCard = ({ 
  title, 
  company, 
  location, 
  salary, 
  description, 
  type 
}: JobCardProps) => {
  const typeColorMap = {
    "Full-time": "bg-green-100 text-green-800",
    "Part-time": "bg-blue-100 text-blue-800",
    "Gig": "bg-yellow-100 text-yellow-800"
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-medium ${typeColorMap[type]} mb-2`}>
              {type}
            </Badge>
            <h3 className="text-xl font-bold text-forest">{title}</h3>
            <p className="text-gray-600">{company}</p>
          </div>
          <button className="text-gray-400 hover:text-clay" aria-label="Bookmark job">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <div className="flex items-center mr-4">
            <MapPin className="h-4 w-4 mr-1 text-clay" />
            <span>{location}</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1 text-clay" />
            <span>{salary}</span>
          </div>
        </div>
        <p className="text-brown mb-6 line-clamp-3">
          {description}
        </p>
        <a href="#" className="text-forest hover:text-clay font-medium transition duration-300 flex items-center">
          Learn More <ArrowRight className="h-4 w-4 ml-2" />
        </a>
      </CardContent>
    </Card>
  );
};

const FeaturedJobs = () => {
  const featuredJobs = [
    {
      title: "Restaurant Manager",
      company: "Big Horn Grill",
      location: "Downtown Sheridan",
      salary: "$45-55K",
      description: "Experienced restaurant manager needed for popular local establishment. Must have 3+ years experience in food service management.",
      type: "Full-time" as const
    },
    {
      title: "Trail Guide",
      company: "Sheridan Outfitters",
      location: "Bighorn Mountains",
      salary: "$18-22/hr",
      description: "Seeking outdoor enthusiasts with knowledge of local trails to lead hiking and horseback riding tours on weekends.",
      type: "Part-time" as const
    },
    {
      title: "Website Developer",
      company: "Sheridan Small Business Alliance",
      location: "Remote / Sheridan",
      salary: "$1,500-2,500",
      description: "Looking for a web developer to create websites for 3 local businesses. Project-based work with possibility for ongoing maintenance.",
      type: "Gig" as const
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-forest">Featured Opportunities</h2>
          <a href="#" className="text-clay hover:underline font-medium flex items-center">
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredJobs.map((job, index) => (
            <JobCard 
              key={index}
              title={job.title}
              company={job.company}
              location={job.location}
              salary={job.salary}
              description={job.description}
              type={job.type}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
