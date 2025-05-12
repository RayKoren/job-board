import { Star, StarHalf } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  name: string;
  position: string;
  rating: number;
}

const TestimonialCard = ({
  quote,
  name,
  position,
  rating
}: TestimonialCardProps) => {
  // Generate rating stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="text-yellow-400 fill-yellow-400 h-5 w-5" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="text-yellow-400 fill-yellow-400 h-5 w-5" />);
    }
    
    return stars;
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 border border-white border-opacity-20">
      <div className="flex items-center mb-4">
        {renderStars()}
      </div>
      <p className="italic mb-6">
        {quote}
      </p>
      <div className="flex items-center">
        <div>
          <h4 className="font-bold">{name}</h4>
          <p className="text-sm">{position}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      quote: "As a small business owner, finding reliable employees was always a challenge until I discovered Sheridan Jobs. Within days of posting, I found the perfect candidate who's now been with us for over a year.",
      name: "Sarah Johnson",
      position: "Main Street Bakery",
      rating: 5
    },
    {
      quote: "After moving to Sheridan, I was worried about finding work. Sheridan Jobs connected me with several gigs that helped me get established, and eventually led to my current full-time position.",
      name: "Michael Torres",
      position: "Graphic Designer",
      rating: 5
    },
    {
      quote: "I needed seasonal help for my ranch during calving season. Posted a gig on Sheridan Jobs and had five qualified applicants within 48 hours. Will definitely use this platform again.",
      name: "Robert Miller",
      position: "Big Sky Ranch",
      rating: 4.5
    }
  ];

  return (
    <section 
      className="py-20 bg-cover bg-center text-white relative"
      style={{ 
        backgroundImage: "url('https://images.pexels.com/photos/2387418/pexels-photo-2387418.jpeg?auto=compress&cs=tinysrgb&w=1600')" 
      }}
    >
      <div className="absolute inset-0 bg-forest bg-opacity-80"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Community Says</h2>
          <p className="text-lg max-w-2xl mx-auto">
            Hear from businesses and job seekers who have found success through Sheridan Jobs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              position={testimonial.position}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
