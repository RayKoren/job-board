import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import PostJob from "@/pages/PostJob";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={() => {
        return (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <header className="pt-28 pb-8 bg-forest text-white text-center">
              <h1 className="text-4xl font-bold mb-4">Job Posting Plans & Pricing</h1>
              <p className="text-xl max-w-2xl mx-auto px-4">
                Choose the right plan to connect with job seekers in Sheridan County
              </p>
            </header>
            <main className="flex-grow">
              <Pricing />
            </main>
            <Footer />
          </div>
        );
      }} />
      <Route path="/post-job" component={PostJob} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
