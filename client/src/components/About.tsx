import { Users, Handshake } from "lucide-react";

const About = () => {
  return (
    <section id="about" className="py-20 bg-sand">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <img 
              src="https://images.pexels.com/photos/14833209/pexels-photo-14833209.jpeg?auto=compress&cs=tinysrgb&w=1600" 
              alt="Mint Bar in Sheridan, Wyoming" 
              className="rounded-xl shadow-lg w-full h-auto"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-forest mb-6 relative">
              About Sheridan Jobs
              <span className="absolute bottom-0 left-0 w-20 h-1 bg-clay"></span>
            </h2>
            <p className="text-lg text-brown mb-6 leading-relaxed">
              Sheridan Jobs was created to strengthen our local economy by connecting businesses and residents across Sheridan County. We believe in supporting our community and helping local employers find the talent they need.
            </p>
            <p className="text-lg text-brown mb-8 leading-relaxed">
              From ranches needing seasonal help to businesses seeking full-time employees, our platform makes it straightforward to post and find jobs in Sheridan and the surrounding areas. Our goal is simple: connect local talent with local opportunities.
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
