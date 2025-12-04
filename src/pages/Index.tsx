import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import EventsGallery from "@/components/EventsGallery";
import groupPhoto from "@/assets/group-photo.jpeg";
import workshopLarge from "@/assets/workshop-large.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-8 md:pt-36 md:pb-12 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-br from-ella-cream via-muted/40 to-ella-blush/30" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-5 py-2.5 rounded-full mb-10 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Empowering Women in STEAM
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground mb-8 leading-[1.1]">
              Where Women{" "}
              <span className="italic text-primary">Rise</span>
              <br />
              Together
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Empowering the rising generation of women to pursue higher education and embrace their heritage through mentoring, creative workshops, and leadership opportunities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-lg">
                <Link to="/events">
                  Explore Events
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5 px-8 py-6 text-base rounded-lg">
                <Link to="/donate">Support Our Mission</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <EventsGallery />

      {/* About Preview */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-4 py-2 rounded-full mb-6 text-sm font-medium">
                <Heart className="h-4 w-4 text-primary" />
                Our Mission
              </div>
              <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
                Every Girl Deserves to{" "}
                <span className="italic text-primary">Shine</span>
              </h2>
              <p className="text-foreground/70 mb-6 leading-relaxed text-lg">
                Ella Rises is dedicated to empowering young women through transformative programs that build confidence, develop leadership skills, and create lasting connections.
              </p>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Through workshops, mentorship programs, and community events, we create safe spaces where teen girls can explore their potential and develop the skills they need to thrive.
              </p>
              <Button asChild variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5 rounded-lg px-6">
                <Link to="/about">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src={groupPhoto} 
                alt="Ella Rises participants at Huntsman Cancer Institute" 
                className="aspect-[4/3] w-full object-cover object-[center_100%] rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Highlight */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={workshopLarge} 
              alt="Girls participating in an Ella Rises workshop"
              className="w-full h-[300px] md:h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ella-charcoal/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white">
              <p className="text-sm md:text-base font-medium text-ella-warm-cream/90 mb-2">Summer Summit 2024</p>
              <h3 className="text-2xl md:text-3xl font-serif">100+ Girls. One Vision.</h3>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-ella-charcoal via-ella-charcoal to-ella-charcoal/95">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-serif text-white mb-6">
            Help Us{" "}
            <span className="italic text-ella-pink">Rise</span>{" "}
            Together
          </h2>
          <p className="text-white/60 max-w-3xl mx-auto mb-10 text-lg">
            Your support enables us to continue providing transformative STEAM programs, mentoring opportunities, and leadership development for the rising generation of women.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-base rounded-lg">
              <Link to="/donate">
                Make a Donation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-ella-sage text-ella-charcoal hover:bg-ella-sage/90 px-10 py-6 text-base rounded-lg font-medium">
              <Link to="/about">Volunteer With Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;
