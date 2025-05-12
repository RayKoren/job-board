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
import { motion } from "framer-motion";

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
    <motion.div
      whileHover={{ 
        scale: 1.03,
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-medium ${typeColorMap[type]} mb-2`}>
                {type}
              </Badge>
              <h3 className="text-xl font-bold text-forest">{title}</h3>
              <p className="text-gray-600">{company}</p>
            </div>
            <motion.button 
              className="text-gray-400 hover:text-clay" 
              aria-label="Bookmark job"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bookmark className="h-5 w-5" />
            </motion.button>
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
          <motion.a 
            href="#" 
            className="text-forest hover:text-clay font-medium transition duration-300 flex items-center"
            whileHover={{ x: 5 }}
          >
            Learn More <motion.span whileHover={{ x: 3 }}><ArrowRight className="h-4 w-4 ml-2" /></motion.span>
          </motion.a>
        </CardContent>
      </Card>
    </motion.div>
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

  // Animation variants for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-forest"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            Featured Opportunities
          </motion.h2>
          <motion.a 
            href="#" 
            className="text-clay hover:underline font-medium flex items-center"
            whileHover={{ x: 5 }}
          >
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </motion.a>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {featuredJobs.map((job, index) => (
            <motion.div key={index} variants={item}>
              <JobCard 
                title={job.title}
                company={job.company}
                location={job.location}
                salary={job.salary}
                description={job.description}
                type={job.type}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
