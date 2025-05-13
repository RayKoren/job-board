import { 
  MapPin, 
  DollarSign, 
  ArrowRight,
  Bookmark,
  Loader2
} from "lucide-react";
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Job {
  id: number;
  businessUserId: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
  benefits?: string | null;
  compensationType: string;
  salaryRange?: string | null;
  hourlyRate?: string | null;
  contactEmail?: string | null;
  applicationUrl?: string | null;
  contactPhone?: string | null;
  status: string;
  plan: string;
  addons: string[];
  featured: boolean;
  expiresAt?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const typeColorMap: Record<string, string> = {
    "Full-time": "bg-green-100 text-green-800",
    "Part-time": "bg-blue-100 text-blue-800",
    "Gig": "bg-yellow-100 text-yellow-800",
    "Contract": "bg-purple-100 text-purple-800",
    "Temporary": "bg-orange-100 text-orange-800",
    "Internship": "bg-teal-100 text-teal-800"
  };

  // Get the appropriate salary display string
  const salaryDisplay = job.compensationType === 'Salary' 
    ? job.salaryRange 
    : job.compensationType === 'Hourly' 
      ? job.hourlyRate 
      : 'Negotiable';

  const colorClass = typeColorMap[job.type] || "bg-gray-100 text-gray-800";

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
              <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass} mb-2`}>
                {job.type}
              </Badge>
              <h3 className="text-xl font-bold text-forest">{job.title}</h3>
              <p className="text-gray-600">{job.company}</p>
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
              <span>{job.location}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1 text-clay" />
              <span>{salaryDisplay}</span>
            </div>
          </div>
          <p className="text-brown mb-6 line-clamp-3">
            {job.description}
          </p>
          <motion.div
            className="text-forest hover:text-clay font-medium transition duration-300 flex items-center"
            whileHover={{ x: 5 }}
          >
            <Link to={`/jobs/${job.id}`} className="flex items-center">
              Learn More <motion.span whileHover={{ x: 3 }}><ArrowRight className="h-4 w-4 ml-2" /></motion.span>
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FeaturedJobs = () => {
  // Fetch all active jobs
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Handle loading and error states
  const isError = !!error;

  // Process jobs to select featured ones first and then random selection
  const processJobs = () => {
    if (!jobs || jobs.length === 0) return [];
    
    // Filter for active jobs
    const activeJobs = jobs.filter((job: Job) => job.status === 'active');
    if (activeJobs.length === 0) return [];
    
    // First get all featured jobs
    const featuredJobs = activeJobs.filter((job: Job) => job.featured);
    
    // If we have 4 or more featured jobs, just take the first 4
    if (featuredJobs.length >= 4) {
      return featuredJobs.slice(0, 4);
    }
    
    // If we have less than 4 featured jobs, we need to fill the remaining slots
    // with randomly selected active jobs that aren't already featured
    const nonFeaturedJobs = activeJobs.filter((job: Job) => !job.featured);
    
    // Shuffle non-featured jobs to get random selection
    const shuffledJobs = [...nonFeaturedJobs].sort(() => Math.random() - 0.5);
    
    // Take only what we need to reach 4 total
    const remainingNeeded = Math.min(4 - featuredJobs.length, shuffledJobs.length);
    const selectedNonFeatured = shuffledJobs.slice(0, remainingNeeded);
    
    // Combine featured with randomly selected non-featured jobs
    return [...featuredJobs, ...selectedNonFeatured];
  };

  // Get the featured and random jobs
  const displayJobs = processJobs();

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
          <motion.div
            className="text-clay hover:underline font-medium flex items-center"
            whileHover={{ x: 5 }}
          >
            <Link to="/jobs" className="flex items-center">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </motion.div>
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-forest" />
          </div>
        )}
        
        {isError && (
          <div className="text-center py-16">
            <p className="text-red-500">Unable to load job listings. Please try again later.</p>
          </div>
        )}
        
        {!isLoading && !isError && displayJobs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">No job listings available at the moment.</p>
          </div>
        )}
        
        {!isLoading && !isError && displayJobs.length > 0 && (
          <motion.div 
            className={`grid grid-cols-1 ${displayJobs.length >= 2 ? 'md:grid-cols-2' : ''} ${displayJobs.length >= 3 ? 'lg:grid-cols-3' : ''} ${displayJobs.length >= 4 ? 'xl:grid-cols-4' : ''} gap-8`}
            variants={container}
            initial="hidden"
            animate="show"
          >
            {displayJobs.map((job: Job) => (
              <motion.div key={job.id} variants={item}>
                <JobCard job={job} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default FeaturedJobs;
