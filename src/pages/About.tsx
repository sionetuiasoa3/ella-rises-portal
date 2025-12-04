import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sparkles, Calendar, ArrowRight, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import stemWorkshop from "@/assets/stem-workshop.jpg";
import mariachiPerformance from "@/assets/mariachi-performance.jpeg";

// Team portraits
import nadiaCates from "@/assets/team/nadia-cates.jpeg";
import claudiaBarillas from "@/assets/team/claudia-barillas.jpg";

// Board portraits
import emmaGuapo from "@/assets/team/emma-guapo.jpg";
import denniaGayle from "@/assets/team/dennia-gayle.jpeg";
import bertBarillas from "@/assets/team/bert-barillas.jpg";
import rogelioOsuna from "@/assets/team/rogelio-osuna.jpg";
import zachHeadshot from "@/assets/team/zach.jpg";
import rickHeizer from "@/assets/team/rick-heizer.jpg";
import shawnPortrait from "@/assets/team/shawn.jpg";
import kathyLarrabee from "@/assets/team/kathy-larrabee.jpg";
const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-8 md:pt-36 md:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-ella-cream/50 to-ella-sage/40" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-ella-cream via-muted/40 to-ella-blush/30" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-5 py-2.5 rounded-full mb-8 text-sm font-medium">
              <Heart className="h-4 w-4 text-primary" />
              Our Mission
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Every Girl Deserves to{" "}
              <span className="italic text-primary">Shine</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
              Ella Rises is dedicated to empowering young women through transformative programs that build confidence, develop leadership skills, and create lasting connections.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission Video Section */}
      <section className="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden bg-ella-sage/40">
        <div className="container mx-auto px-6 relative">
          {/* Mission Header */}
          <h2 className="text-3xl md:text-5xl font-serif text-foreground text-center mb-12 md:mb-16 tracking-wide">
            OUR MISSION
          </h2>
          
          {/* Video */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="aspect-video rounded-lg overflow-hidden shadow-xl">
              <video 
                className="w-full h-full object-cover"
                controls
                playsInline
              >
                <source 
                  src="https://video.wixstatic.com/video/e5f869_f075e19ca2744354bb20a65881dce28f/1080p/mp4/file.mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          
          {/* Mission Statement */}
          <p className="text-xl md:text-2xl text-foreground/70 text-center max-w-3xl mx-auto leading-relaxed font-light italic">
            Empowering young women to pursue higher education through high-impact multicultural activities focused on mariachi and STEAM.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6 leading-tight">
                Our Story
              </h2>
              <p className="text-foreground/70 mb-6 leading-relaxed text-lg">
                Ella Rises was founded with a simple but powerful vision: to create a world where every young woman has the confidence, skills, and support to achieve her dreams.
              </p>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Through workshops, mentorship programs, and community events, we create safe spaces where teen girls can explore their potential and develop the skills they need to thrive in STEAM fields and beyond.
              </p>
              <Button variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5 rounded-lg px-6">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <img 
                src={stemWorkshop} 
                alt="Young women participating in a STEM workshop" 
                className="aspect-[4/3] w-full object-cover rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Heritage Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 md:order-1">
              <img 
                src={mariachiPerformance} 
                alt="Young women performing traditional mariachi music" 
                className="aspect-[4/3] w-full object-cover rounded-3xl shadow-xl"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6 leading-tight">
                Embracing Heritage
              </h2>
              <p className="text-foreground/70 mb-6 leading-relaxed text-lg">
                We believe in celebrating cultural heritage as a source of strength and identity. Our programs include traditional arts, music, and cultural education.
              </p>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Through mariachi, folklorico, and traditional arts workshops, young women connect with their roots while building confidence and performance skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="relative overflow-hidden">
        {/* Header background with centered title */}
        <div className="bg-ella-sage/50 py-8 md:py-12">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground text-center tracking-wide">
            MEET THE TEAM
          </h2>
        </div>
        
        <div className="container mx-auto px-6 py-6 md:py-8">
          
          {/* Nadia Cates - Featured Card */}
          <div className="bg-ella-blush/30 border-l-4 border-primary rounded-r-2xl mb-8 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-8 md:p-12 order-2 md:order-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl md:text-4xl font-serif text-foreground">Nadia Cates</h3>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-7 w-7 fill-current" />
                  </a>
                </div>
                <div className="w-16 h-0.5 bg-primary mb-4" />
                <h4 className="text-xl md:text-2xl font-serif text-foreground mb-6">Founder and Executive Director</h4>
                <div className="text-foreground/70 space-y-4 leading-relaxed">
                  <p>
                    Nadia is from the borderlands of Mexico and Southern California. She is the oldest of 3 daughters and inspired by her parents love and devotion for each other, their family, and God. She is a mother of 6 and married to an incredible man. She studied Human Development at Brigham Young University and graduated in 2007. In 2013, she and her young family moved to Mexico City, where she studied for a year in a Mexican Culinary Institute under the great Maestros Yuri de Gortari and Edmundo Escamilla.
                  </p>
                  <p>
                    It was while living in Mexico City that the idea of Ella Rises was conceived. Nadia connected deeply with her heritage and saw it in a different light from when she was growing up in the U.S. She believes that as we embrace our spiritual <em>and</em> cultural heritage we can attain more clarity and confidence towards an empowering cycle of progress.
                  </p>
                  <p>
                    Nadia is grateful to lead Ella Rises as the Creative and Executive Director.
                  </p>
                </div>
              </div>
              <div className="md:w-[350px] lg:w-[400px] order-1 md:order-2">
                <img 
                  src={nadiaCates} 
                  alt="Nadia Cates"
                  className="w-full h-full object-cover min-h-[300px] md:min-h-full"
                />
              </div>
            </div>
          </div>

          {/* Claudia Barillas - Featured Card */}
          <div className="bg-ella-blush/30 border-l-4 border-primary rounded-r-2xl overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-[350px] lg:w-[400px]">
                <img 
                  src={claudiaBarillas} 
                  alt="Claudia Barillas"
                  className="w-full h-full object-cover min-h-[300px] md:min-h-full"
                />
              </div>
              <div className="flex-1 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl md:text-4xl font-serif text-foreground">Claudia Barillas</h3>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                    <Linkedin className="h-7 w-7 fill-current" />
                  </a>
                </div>
                <div className="w-16 h-0.5 bg-primary mb-4" />
                <h4 className="text-xl md:text-2xl font-serif text-foreground mb-6">Program Director</h4>
                <div className="text-foreground/70 space-y-4 leading-relaxed">
                  <p>
                    Claudia was raised in Los Angeles, California, after her family emigrated from Michoacán, Mexico. She is a dedicated community leader and advocate, holding a Bachelor's degree in Social Work from Cal State L.A. and a Master's in Public Administration from Brigham Young University.
                  </p>
                  <p>
                    Over the past 20 years, Claudia has worked tirelessly to promote social justice and address social issues, focusing on substance recovery, mental health, community advocacy, and education. She currently serves as the Human Services Director in Utah County, where she continues her mission to strengthen families, improve community and create meaningful social impact.
                  </p>
                  <p>
                    Outside of her professional work, Claudia devotes her time to her husband, two children, exploring the outdoors, and serving the community. She is passionate about her cultural roots, building genuine connections and empowering youth through her involvement with Ella Rises, where she helps young people embrace their identity and pursue their dreams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Board of Directors Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground text-center mb-12 tracking-wide">
            BOARD OF DIRECTORS
          </h2>
          
          {/* Board members on sage background */}
          <div className="bg-ella-sage/40 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "Emma Guapo", role: "Chair of the Board", image: emmaGuapo },
                { name: "Dennia Gayle", role: "Vice Chair", image: denniaGayle },
                { name: "Bert Barillas", role: "Secretary", image: bertBarillas },
                { name: "Rogelio Osuna", role: "Treasurer", image: rogelioOsuna },
                { name: "Zachariah Parry", role: "Board Member", image: zachHeadshot },
                { name: "Shawn Cates", role: "Board Member", image: shawnPortrait },
                { name: "Kathy Larrabee", role: "Board Member", image: kathyLarrabee },
                { name: "Rick Heizer", role: "Board Member", image: rickHeizer },
              ].map((member, index) => (
                <div key={index} className="flex flex-col">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full aspect-square object-cover rounded-lg mb-3"
                  />
                  {/* Name card */}
                  <div className="bg-background p-3 rounded-lg shadow-md">
                    <div className="border-l-2 border-primary pl-3">
                      <h3 className="text-sm md:text-base font-medium text-foreground">
                        {member.name}
                      </h3>
                      <p className="text-foreground/60 text-xs">{member.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-4 py-2 rounded-full mb-6 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              What We Offer
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-4">Our Programs</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
              Discover the ways we support and empower young women in our community.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Mentorship",
                description: "Connect with inspiring women mentors who guide, support, and encourage personal growth.",
              },
              {
                icon: Sparkles,
                title: "Workshops",
                description: "Interactive sessions on leadership, creativity, wellness, and essential life skills.",
              },
              {
                icon: Calendar,
                title: "Community Events",
                description: "Fun gatherings that build friendships and celebrate the achievements of our girls.",
              },
            ].map((program, index) => (
              <Card key={index} className="bg-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <program.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-3">{program.title}</h3>
                  <p className="text-foreground/60 leading-relaxed">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-10 text-lg">
            Join us in empowering the next generation of women leaders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-lg">
              <Link to="/donate">Support Our Mission</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-foreground/20 text-foreground hover:bg-foreground/5 px-8 py-6 text-base rounded-lg">
              <Link to="/events">View Events</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default About;
