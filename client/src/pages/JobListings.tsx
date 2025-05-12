import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';

// Mock data for job listings
const MOCK_JOBS = [
  {
    id: 1,
    title: 'Marketing Manager',
    company: 'Sheridan Digital',
    location: 'Sheridan, WY',
    type: 'Full-time',
    compensationType: 'salary',
    salaryRange: '$60,000 - $80,000/year',
    hourlyRate: null,
    posted: '2 days ago',
    featured: true,
    description: 'We are seeking a Marketing Manager to lead our digital marketing efforts...',
    tags: ['Marketing', 'Management', 'Digital Media'],
  },
  {
    id: 2,
    title: 'Barista',
    company: 'Mountain Brew Coffee',
    location: 'Sheridan, WY',
    type: 'Part-time',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$15 - $18/hour',
    posted: '1 day ago',
    featured: false,
    description: 'Join our team as a barista in our busy downtown location...',
    tags: ['Food Service', 'Customer Service'],
  },
  {
    id: 3,
    title: 'Ranch Hand',
    company: 'Diamond Ranch',
    location: 'Dayton, WY',
    type: 'Full-time',
    compensationType: 'both',
    salaryRange: '$40,000 - $50,000/year',
    hourlyRate: '$18 - $22/hour',
    posted: '5 days ago',
    featured: false,
    description: 'Experienced ranch hand needed for cattle operations and general maintenance...',
    tags: ['Agriculture', 'Outdoor', 'Physical Labor'],
  },
  {
    id: 4,
    title: 'Web Developer',
    company: 'Tech Innovations',
    location: 'Remote (Wyoming-based)',
    type: 'Contract',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$30 - $45/hour',
    posted: '3 days ago',
    featured: true,
    description: 'Looking for a frontend developer with React experience for a 6-month project...',
    tags: ['IT', 'Developer', 'Remote'],
  },
  {
    id: 5,
    title: 'Retail Associate',
    company: 'Main Street Boutique',
    location: 'Sheridan, WY',
    type: 'Part-time',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$14 - $16/hour',
    posted: '1 week ago',
    featured: false,
    description: 'Customer-focused retail associate needed for women\'s clothing boutique...',
    tags: ['Retail', 'Customer Service', 'Sales'],
  },
  {
    id: 6,
    title: 'Construction Worker',
    company: 'Mountain Build Co.',
    location: 'Sheridan, WY',
    type: 'Full-time',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$22 - $28/hour',
    posted: '4 days ago',
    featured: false,
    description: 'Experienced construction worker for residential and commercial projects...',
    tags: ['Construction', 'Physical Labor', 'Skilled Trade'],
  },
  {
    id: 7,
    title: 'Administrative Assistant',
    company: 'Sheridan Legal',
    location: 'Sheridan, WY',
    type: 'Full-time',
    compensationType: 'salary',
    salaryRange: '$35,000 - $45,000/year',
    hourlyRate: null,
    posted: '3 days ago',
    featured: false,
    description: 'Administrative assistant for busy law office. Legal experience preferred...',
    tags: ['Administrative', 'Office', 'Legal'],
  },
  {
    id: 8,
    title: 'Home Health Aide',
    company: 'Caring Connections',
    location: 'Sheridan County, WY',
    type: 'Part-time',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$16 - $19/hour',
    posted: '2 days ago',
    featured: true,
    description: 'Compassionate caregivers needed for in-home senior care services...',
    tags: ['Healthcare', 'Caregiving', 'Senior Care'],
  },
  {
    id: 9,
    title: 'Accounting Clerk',
    company: 'Wyoming Financial',
    location: 'Sheridan, WY',
    type: 'Full-time',
    compensationType: 'salary',
    salaryRange: '$38,000 - $45,000/year',
    hourlyRate: null,
    posted: '1 week ago',
    featured: false,
    description: 'Entry-level accounting position with opportunity for growth...',
    tags: ['Accounting', 'Finance', 'Entry Level'],
  },
  {
    id: 10,
    title: 'Landscaper',
    company: 'Green Earth Landscaping',
    location: 'Sheridan, WY',
    type: 'Seasonal',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$17 - $20/hour',
    posted: '5 days ago',
    featured: false,
    description: 'Landscape maintenance, lawn care, and garden installation team members needed...',
    tags: ['Outdoor', 'Physical Labor', 'Seasonal'],
  },
  {
    id: 11,
    title: 'Server/Bartender',
    company: 'Mountain View Grill',
    location: 'Big Horn, WY',
    type: 'Part-time',
    compensationType: 'hourly',
    salaryRange: null,
    hourlyRate: '$12 - $18/hour + tips',
    posted: '2 days ago',
    featured: false,
    description: 'Experienced server/bartender for upscale casual restaurant...',
    tags: ['Food Service', 'Customer Service', 'Hospitality'],
  },
  {
    id: 12,
    title: 'Truck Driver',
    company: 'Wyoming Transport',
    location: 'Sheridan, WY',
    type: 'Full-time',
    compensationType: 'both',
    salaryRange: '$50,000 - $70,000/year',
    hourlyRate: '$22 - $28/hour',
    posted: '3 days ago',
    featured: true,
    description: 'CDL driver for regional routes. Home most weekends...',
    tags: ['Transportation', 'CDL', 'Driving'],
  },
];

// Interface for job listings
interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  compensationType: string;
  salaryRange: string | null;
  hourlyRate: string | null;
  posted: string;
  featured: boolean;
  description: string;
  tags: string[];
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
  
  // State for filtered jobs
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(MOCK_JOBS);
  
  // Available job types for filtering
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Gig', 'Internship', 'Seasonal'];
  
  // Filter jobs based on selected filters
  useEffect(() => {
    let result = MOCK_JOBS;
    
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(query) || 
        job.company.toLowerCase().includes(query) || 
        job.description.toLowerCase().includes(query) ||
        job.tags.some(tag => tag.toLowerCase().includes(query))
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
      // Already sorted by default in our mock data
    } else if (sortBy === 'dateAsc') {
      result = [...result].reverse();
    } else if (sortBy === 'featured') {
      result = [...result].sort((a, b) => (a.featured === b.featured) ? 0 : a.featured ? -1 : 1);
    }
    
    setFilteredJobs(result);
  }, [searchQuery, jobType, location, compensationFilter, minSalary, sortBy]);
  
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

// Job Card Component
function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <motion.div 
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${job.featured ? 'border-l-4 border-clay' : ''}`}
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
              {job.featured && (
                <Badge className="bg-clay">Featured</Badge>
              )}
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
                <span>Posted {job.posted}</span>
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
                <Button className="bg-forest">
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
  );
}