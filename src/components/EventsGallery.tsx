import { useEffect, useRef } from "react";
import { Camera } from "lucide-react";

// Existing images
import groupPhoto from "@/assets/group-photo.jpeg";
import mariachiPerformance from "@/assets/mariachi-performance.jpeg";
import stemWorkshop from "@/assets/stem-workshop.jpg";
import mariachiGirl from "@/assets/mariachi-girl.png";

// New images
import mentorshipTalk from "@/assets/mentorship-talk.jpg";
import summerSummit from "@/assets/summer-summit.jpg";
import stemBuilding from "@/assets/stem-building.jpg";
import mariachiOutdoor from "@/assets/mariachi-outdoor.png";
import classroomPerformance from "@/assets/classroom-performance.jpeg";
import fieldTripGroup from "@/assets/field-trip-group.jpeg";
import communityAudience from "@/assets/community-audience.jpeg";
import trumpetPractice from "@/assets/trumpet-practice.jpeg";

const galleryImages = [
  { src: groupPhoto, alt: "Group photo of Ella Rises participants" },
  { src: mentorshipTalk, alt: "Mentorship session with students" },
  { src: summerSummit, alt: "Summer summit workshop activities" },
  { src: mariachiPerformance, alt: "Mariachi performance" },
  { src: stemBuilding, alt: "STEM workshop building activity" },
  { src: classroomPerformance, alt: "Classroom music performance" },
  { src: fieldTripGroup, alt: "Field trip group photo" },
  { src: stemWorkshop, alt: "STEM workshop" },
  { src: communityAudience, alt: "Community event audience" },
  { src: trumpetPractice, alt: "Trumpet practice session" },
  { src: mariachiOutdoor, alt: "Outdoor mariachi performance" },
  { src: mariachiGirl, alt: "Young mariachi performer" },
];

const EventsGallery = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      scrollPosition += speed;
      
      // Reset when we've scrolled through the first set
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Pause on hover
    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Duplicate images for seamless loop
  const duplicatedImages = [...galleryImages, ...galleryImages];

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-6 mb-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-4 py-2 rounded-full mb-4 text-sm font-medium">
            <Camera className="h-4 w-4 text-primary" />
            Memories
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground">
            Moments That <span className="italic text-primary">Inspire</span>
          </h2>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-hidden cursor-grab"
        style={{ scrollBehavior: "auto" }}
      >
        {duplicatedImages.map((image, index) => (
          <div 
            key={index} 
            className="flex-shrink-0 w-72 h-48 md:w-80 md:h-56 rounded-xl overflow-hidden shadow-lg"
          >
            <img 
              src={image.src} 
              alt={image.alt}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default EventsGallery;
