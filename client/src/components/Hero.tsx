import { Button } from "@/components/ui/button";
import wyomingTetons from "../assets/wyoming-tetons.jpg";
import wyomingBighorns from "../assets/wyoming-bighorns.jpg";

const Hero = () => {
  return (
    <section 
      id="home" 
      className="relative h-screen bg-cover bg-center brightness-110"
      style={{ 
        backgroundImage: `url(${wyomingBighorns})` 
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-35"></div>
      <div className="container mx-auto px-4 h-full flex items-center relative z-10">
        <div className="text-white max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Sheridan Wyoming Jobs & Gigs
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Connecting local businesses with talent in the Sheridan community
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              asChild
              className="bg-clay hover:bg-opacity-90 text-white font-medium px-8 py-6 rounded-lg shadow-lg transition duration-300"
              size="lg"
            >
              <a href="#services">Post Now</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-2 border-white font-medium px-8 py-6 rounded-lg shadow-lg transition duration-300"
              size="lg"
            >
              <a href="#services">Find a Job</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
