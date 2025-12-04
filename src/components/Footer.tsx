import { Heart, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-16 bg-ella-charcoal text-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-serif italic mb-4">Ella Rises</h3>
            <p className="text-white/60 leading-relaxed">
              Empowering the rising generation of women to pursue higher education and embrace their heritage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <a href="https://givebutter.com/EllaRises" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Donate
                </a>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-serif text-lg mb-4">Programs</h4>
            <ul className="space-y-3 text-white/60">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  STEAM Workshops
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Mentoring
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Leadership
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Scholarships
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-white/60">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@ellarises.org
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Provo, Utah
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ella-warm-cream/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ella-warm-cream/60">
            © 2025 Ella Rises. All rights reserved.
          </p>
          <p className="text-sm text-ella-warm-cream/60 flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-ella-pink" /> for empowering women
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
