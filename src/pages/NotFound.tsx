import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main role="main" className="flex-1 flex items-center justify-center bg-muted pt-28 pb-16">
        <div className="text-center p-8 bg-card border border-border rounded-2xl max-w-md w-full mx-4 shadow-sm">
          <h1 className="mb-4 text-6xl font-black text-primary">404</h1>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Page Not Found</h2>
          <p className="mb-8 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
          <Link to="/" className="inline-flex justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent-400 to-accent-600 text-neutral-900 font-bold text-lg hover:scale-[1.01] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
