import { useState, useEffect } from "react";
import { Mountain } from "lucide-react";
import { useLocation } from "wouter";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location] = useLocation();
  const isHomePage = location === "/";

  // Handle scroll event to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed w-full bg-white bg-opacity-95 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <a href="/" className="flex items-center">
          <Mountain className="h-8 w-8 text-forest mr-2" />
          <h1 className="text-2xl font-bold text-forest">Sheridan Jobs</h1>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a href={isHomePage ? "#home" : "/"} className="font-medium text-brown hover:text-forest transition duration-300">Home</a>
          <a href={isHomePage ? "#about" : "/#about"} className="font-medium text-brown hover:text-forest transition duration-300">About</a>
          <a href={isHomePage ? "#services" : "/#services"} className="font-medium text-brown hover:text-forest transition duration-300">Services</a>
          <a href={isHomePage ? "#contact" : "/#contact"} className="font-medium text-brown hover:text-forest transition duration-300">Contact</a>
          <a href="/pricing" className={`font-medium ${location === "/pricing" ? "text-forest font-semibold" : "text-clay"} hover:text-forest transition duration-300`}>Pricing</a>
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleMobileMenu} 
          className="md:hidden text-brown"
          aria-label="Toggle mobile menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile Navigation Menu */}
      <div className={`md:hidden bg-white py-4 px-4 shadow-inner ${isMobileMenuOpen ? '' : 'hidden'}`}>
        <nav className="flex flex-col space-y-4">
          <a 
            href={isHomePage ? "#home" : "/"} 
            className="font-medium text-brown hover:text-forest transition duration-300"
            onClick={closeMobileMenu}
          >
            Home
          </a>
          <a 
            href={isHomePage ? "#about" : "/#about"} 
            className="font-medium text-brown hover:text-forest transition duration-300"
            onClick={closeMobileMenu}
          >
            About
          </a>
          <a 
            href={isHomePage ? "#services" : "/#services"} 
            className="font-medium text-brown hover:text-forest transition duration-300"
            onClick={closeMobileMenu}
          >
            Services
          </a>
          <a 
            href={isHomePage ? "#contact" : "/#contact"} 
            className="font-medium text-brown hover:text-forest transition duration-300"
            onClick={closeMobileMenu}
          >
            Contact
          </a>
          <a 
            href="/pricing" 
            className={`font-medium ${location === "/pricing" ? "text-forest font-semibold" : "text-clay"} hover:text-forest transition duration-300`}
            onClick={closeMobileMenu}
          >
            Pricing
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
