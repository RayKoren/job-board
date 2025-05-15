import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import DynamicPricing from "@/components/DynamicPricing";
import Footer from "@/components/Footer";

const PricingPage = () => {
  // Handle smooth scrolling
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');
      
      if (anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        
        if (targetId && targetId !== '#') {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const navbarHeight = 80; // Adjust based on your navbar height
            const yOffset = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
            
            window.scrollTo({
              top: yOffset,
              behavior: 'smooth'
            });
          }
        }
      }
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <div className="pt-24 pb-4 bg-forest text-white text-center">
          <h1 className="text-4xl font-bold mb-4">Job Posting Plans & Pricing</h1>
          <p className="text-xl max-w-2xl mx-auto px-4">
            Choose the right plan to connect with job seekers in Sheridan County
          </p>
        </div>
        <DynamicPricing />
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;