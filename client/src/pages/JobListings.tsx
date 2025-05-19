import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ApplyJobForm from '@/components/ApplyJobForm';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  Briefcase,
  Building,
  Clock,
  DollarSign,
  CalendarRange,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

// Interface for job listings from the database
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

export default function JobListings() {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [jobType, setJobType] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [compensationFilter, setCompensationFilter] = useState<string | null>(null);
  const [minSalary, setMinSalary] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('dateDesc');
  
  // Fetch jobs from the API
  const { data: jobs, isLoading, isError } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
  });
  
  // Available job types for filtering
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Gig', 'Internship', 'Seasonal'];
  
  // State for filtered jobs
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  
  // Filter jobs based on selected filters
  useEffect(() => {
    if (!jobs) {
      setFilteredJobs([]);
      return;
    }
    
    let result = [...jobs];
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.description.toLowerCase().includes(query) ||
        (job.tags && job.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    // Job type filter
    if (jobType.length > 0) {
      result = result.filter(job => jobType.includes(job.type));
    }
    
    // Location filter
    if (location) {
      result = result.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    // Compensation type filter
    if (compensationFilter) {
      if (compensationFilter === 'salary') {
        result = result.filter(job => job.compensationType === 'salary' || job.compensationType === 'both');
      } else if (compensationFilter === 'hourly') {
        result = result.filter(job => job.compensationType === 'hourly' || job.compensationType === 'both');
      }
    }
    
    // Sort results
    if (sortBy === 'dateDesc') {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'dateAsc') {
      result = [...result].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'featured') {
      result = [...result].sort((a, b) => (a.featured === b.featured) ? 0 : a.featured ? -1 : 1);
    }
    
    setFilteredJobs(result);
  }, [jobs, searchQuery, jobType, location, compensationFilter, minSalary, sortBy]);
  
  // Handle job type filter changes
  const toggleJobType = (type: string) => {
    if (jobType.includes(type)) {
      setJobType(jobType.filter(t => t !== type));
    } else {
      setJobType([...jobType, type]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setJobType([]);
    setLocation('');
    setCompensationFilter(null);
    setMinSalary(0);
    setSortBy('dateDesc');
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-forest mb-2">Browse Jobs</h1>
            <p className="text-brown">
              Discover job opportunities in Sheridan County, Wyoming
            </p>
          </div>
          
          {/* Search and filter header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Search job title, company, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filters
                  {(jobType.length > 0 || location || compensationFilter || minSalary > 0) && (
                    <Badge className="ml-1 bg-forest">
                      {jobType.length + (location ? 1 : 0) + (compensationFilter ? 1 : 0) + (minSalary > 0 ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateDesc">Newest First</SelectItem>
                    <SelectItem value="dateAsc">Oldest First</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter panel - mobile drawer style on small screens */}
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Job type filter */}
                  <div>
                    <h3 className="font-semibold mb-2 text-forest">Job Type</h3>
                    <div className="space-y-2">
                      {jobTypes.map((type) => (
                        <div key={type} className="flex items-center">
                          <Checkbox 
                            id={`type-${type}`}
                            checked={jobType.includes(type)}
                            onCheckedChange={() => toggleJobType(type)}
                          />
                          <Label htmlFor={`type-${type}`} className="ml-2 cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Location filter */}
                  <div>
                    <h3 className="font-semibold mb-2 text-forest">Location</h3>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        className="pl-10"
                        placeholder="City or area..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Compensation filter */}
                  <div>
                    <h3 className="font-semibold mb-2 text-forest">Compensation</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant={compensationFilter === 'salary' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCompensationFilter(compensationFilter === 'salary' ? null : 'salary')}
                          className={compensationFilter === 'salary' ? 'bg-forest' : ''}
                        >
                          Salary
                        </Button>
                        <Button
                          variant={compensationFilter === 'hourly' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCompensationFilter(compensationFilter === 'hourly' ? null : 'hourly')}
                          className={compensationFilter === 'hourly' ? 'bg-forest' : ''}
                        >
                          Hourly
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Filter actions */}
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <Button 
                    variant="ghost" 
                    onClick={clearFilters}
                    className="text-gray-500"
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => setShowFilters(false)}
                    className="bg-forest ml-2"
                  >
                    Apply Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Job listings and loading states */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={40} className="animate-spin text-forest" />
            </div>
          ) : isError ? (
            <div className="bg-red-50 rounded-lg shadow-sm p-8 text-center">
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error loading jobs</h3>
              <p className="text-red-600 mb-4">
                There was a problem retrieving job listings. Please try again later.
              </p>
            </div>
          ) : (
            <>
              {/* Results info */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-brown">
                  {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
                </p>
                {(jobType.length > 0 || location || compensationFilter || minSalary > 0) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-forest flex items-center gap-1"
                    onClick={clearFilters}
                  >
                    <X size={14} />
                    Clear filters
                  </Button>
                )}
              </div>
              
              {/* Job listings */}
              <div className="space-y-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
                    <p className="text-brown mb-4">
                      Try adjusting your search or filter criteria to find more jobs.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      className="text-forest border-forest"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Job Card Component
function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  const handleApplyClick = () => {
    setIsApplyModalOpen(true);
  };
  
  return (
    <>
      <motion.div 
        className={`rounded-lg shadow-sm overflow-hidden 
          ${job.featured ? 'border-l-4 border-clay' : ''}
          ${job.addons?.includes('highlighted') ? 'bg-amber-100' : 'bg-white'}
          ${job.addons?.includes('top-of-search') ? 'ring-2 ring-forest' : ''}
        `}
        whileHover={{ y: -3, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* Job info */}
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-forest">{job.title}</h2>
                  <div className="flex items-center text-gray-600 mt-1">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{job.company}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.featured && (
                    <Badge className="bg-clay">Featured</Badge>
                  )}
                  {job.addons?.includes('urgent') && (
                    <Badge className="bg-red-600 text-white flex items-center gap-1">
                      <span className="animate-pulse">⚡</span> Urgent Hiring
                    </Badge>
                  )}
                  {job.addons?.includes('top-of-search') && (
                    <Badge className="bg-forest text-white">
                      Promoted
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-clay" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-clay" />
                  <span>{job.type}</span>
                </div>
                {(job.salaryRange || job.hourlyRate) && (
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-clay" />
                    <span>{job.salaryRange || job.hourlyRate}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarRange className="h-4 w-4 mr-2 text-clay" />
                  <span>Posted {
                    (() => {
                      try {
                        return formatDistanceToNow(new Date(job.createdAt)) + ' ago';
                      } catch (e) {
                        return 'recently';
                      }
                    })()
                  }</span>
                </div>
              </div>
              
              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-brown border-brown">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              {/* Expanded content */}
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <p className="text-gray-700 mb-4">
                    {job.description}
                  </p>
                  <Button 
                    className="bg-forest hover:bg-opacity-90"
                    onClick={handleApplyClick}
                  >
                    Apply Now
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
          
          {/* View details button */}
          <div className="mt-4 text-right">
            <Button 
              variant="ghost" 
              className="text-forest font-medium"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <span>View Less</span>
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  <span>View Details</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
      
      {/* Apply Job Form with Consent */}
      <ApplyJobForm 
        jobId={job.id}
        jobTitle={job.title}
        company={job.company}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        contactInfo={{
          email: job.contactEmail || undefined,
          phone: job.contactPhone || undefined,
          applicationUrl: job.applicationUrl || undefined
        }}
      />
    </>
  );
}