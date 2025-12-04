import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import communityEvent from "@/assets/community-event.jpg";
import artWorkshop from "@/assets/art-workshop.jpg";
import folkloricoGirls from "@/assets/folklorico-girls.jpeg";
import dancer from "@/assets/dancer.png";

const Events = () => {
  const upcomingEvents = [
    {
      title: "Leadership Workshop",
      date: "January 15, 2025",
      location: "Community Center",
      spots: "12 spots left",
      description: "Build essential leadership skills through interactive activities and discussions.",
      image: communityEvent,
      imagePosition: "object-bottom",
    },
    {
      title: "Art & Culture Workshop",
      date: "January 22, 2025",
      location: "Wellness Studio",
      spots: "8 spots left",
      description: "Express yourself through traditional art forms and creative projects.",
      image: artWorkshop,
      imagePosition: "object-center",
    },
    {
      title: "Folklorico Dance Class",
      date: "February 5, 2025",
      location: "Dance Studio",
      spots: "20 spots left",
      description: "Learn traditional Mexican folk dance and celebrate cultural heritage.",
      image: folkloricoGirls,
      imagePosition: "object-[center_75%]",
    },
    {
      title: "Spring Performance",
      date: "February 12, 2025",
      location: "Community Theater",
      spots: "15 spots left",
      description: "Showcase your talents at our annual spring performance celebration.",
      image: dancer,
      imagePosition: "object-[center_75%]",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-ella-cream via-muted/40 to-ella-blush/30" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-5 py-2.5 rounded-full mb-8 text-sm font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Join Us
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Upcoming{" "}
              <span className="italic text-primary">Events</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
              Join us at our next gathering and be part of something special. Each event is designed to inspire, connect, and empower.
            </p>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <Card key={index} className="bg-card border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 rounded-2xl">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title}
                    className={`w-full h-full object-cover ${event.imagePosition} group-hover:scale-105 transition-transform duration-300`}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="text-sm text-primary font-semibold mb-2">{event.date}</div>
                  <h3 className="text-xl font-serif text-foreground mb-2">{event.title}</h3>
                  <p className="text-foreground/60 text-sm mb-2">{event.location} • {event.spots}</p>
                  <p className="text-foreground/60 text-sm mb-4">{event.description}</p>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                    Register Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-4 py-2 rounded-full mb-6 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Get Involved
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-10 text-lg">
            We're always adding new events. Sign up for our newsletter to stay updated on upcoming opportunities.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-lg">
            <Link to="/donate">Support Our Events</Link>
          </Button>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Events;
