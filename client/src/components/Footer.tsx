import { Mountain, Facebook, Instagram, Linkedin, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <Mountain className="h-6 w-6 mr-2" />
              <h3 className="text-xl font-bold">Sheridan Jobs</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Connecting local employers with talented job seekers in Sheridan
              County since 2020.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/#about"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="/#services"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="/#contact"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/jobs"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Find a Job
                </a>
              </li>
              <li>
                <a
                  href="/jobs"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Find a Gig
                </a>
              </li>
              <li>
                <a
                  href="/post-job"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Post a Job
                </a>
              </li>
              <li>
                <a
                  href="/post-job"
                  className="text-gray-300 hover:text-white transition duration-300"
                >
                  Post a Gig
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Subscribe</h4>
            <p className="text-gray-300 mb-4">
              Stay updated with new job opportunities in Sheridan.
            </p>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg outline-none focus:ring-2 focus:ring-clay w-full text-brown"
              />
              <button
                type="submit"
                className="bg-clay hover:bg-opacity-90 px-4 py-2 rounded-r-lg transition duration-300"
                aria-label="Subscribe"
              >
                <Layers className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Sheridan Jobs. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a
              href="#"
              className="text-gray-400 hover:text-white transition duration-300"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition duration-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
