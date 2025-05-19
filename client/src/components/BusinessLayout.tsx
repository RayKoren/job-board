import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface BusinessLayoutProps {
  children: ReactNode;
}

const BusinessLayout = ({ children }: BusinessLayoutProps) => {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pb-16">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default BusinessLayout;