import { Users, Handshake } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-sand">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1527489377706-5bf97e608852?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
              alt="Bighorn Mountains landscape" 
              className="rounded-xl shadow-lg w-full h-auto"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-forest mb-6 relative">
              About Sheridan Jobs
              <span className="absolute bottom-0 left-0 w-20 h-1 bg-clay"></span>
            </h2>
            <p className="text-lg text-brown mb-6 leading-relaxed">
              We're just folks from Sheridan who want to help our neighbors find good work and good help. Sheridan Jobs brings together local businesses and workers right here in our corner of Wyoming.
            </p>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              Need a hand on your ranch? Looking for weekend work? Just moved to town and need a job? We've built this simple site to connect people who need work with people who need workers - no complicated stuff, just good old-fashioned community support.
            </p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-clay mr-3" />
                <span className="font-medium">Community Focused</span>
              </div>
              <div className="flex items-center">
                <Handshake className="w-6 h-6 text-clay mr-3" />
                <span className="font-medium">Locally Operated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
