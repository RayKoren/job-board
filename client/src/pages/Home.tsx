import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import FeaturedJobs from "@/components/FeaturedJobs";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Home = () => {
  // Handle smooth scrolling
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a[href^="#"]');

      if (anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute("href");

        if (targetId && targetId !== "#") {
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const navbarHeight = 80; // Adjust based on your navbar height
            const yOffset =
              targetElement.getBoundingClientRect().top +
              window.pageYOffset -
              navbarHeight;

            window.scrollTo({
              top: yOffset,
              behavior: "smooth",
            });
          }
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <FeaturedJobs />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
