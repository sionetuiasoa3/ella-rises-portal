import { Button } from "@/components/ui/button";
import { User, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ellaLogo from "@/assets/ella-rises-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/events", label: "Events" },
    { href: "/contact", label: "Contact Us" },
    { href: "/donate", label: "Donate" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ella-warm-cream/90 backdrop-blur-md border-b border-ella-charcoal/5">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={ellaLogo} alt="Ella Rises" className="h-20 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`font-medium transition-colors ${
                currentPath === link.href
                  ? "text-primary"
                  : "text-foreground/70 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/portal/dashboard"
              className="hidden sm:flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              My Portal
            </Link>
          ) : (
            <Link
              to="/portal/auth"
              className="hidden sm:flex items-center gap-2 text-foreground/70 hover:text-primary transition-colors font-medium"
            >
              <User className="h-4 w-4" />
              Login
            </Link>
          )}
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6">
            <Link to="/donate">Support Us</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
