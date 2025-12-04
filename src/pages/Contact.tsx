import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    option: "",
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form validation
    if (!formData.option || !formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Thank you for your message! We'll get back to you soon.");
    setFormData({
      option: "",
      firstName: "",
      lastName: "",
      email: "",
      message: "",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 text-center">
              Contact <span className="italic text-primary">Us</span>
            </h1>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto text-center mb-12">
              We'd love to hear from you. Reach out to learn more about our programs or how you can support our mission.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Option */}
              <Select 
                value={formData.option} 
                onValueChange={(value) => setFormData({ ...formData, option: value })}
              >
                <SelectTrigger className="w-full bg-ella-sage/30 border-ella-sage text-foreground/70 h-14">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="volunteer">Volunteer Opportunities</SelectItem>
                  <SelectItem value="programs">Programs Information</SelectItem>
                  <SelectItem value="donation">Donation Questions</SelectItem>
                  <SelectItem value="partnership">Partnership Opportunities</SelectItem>
                </SelectContent>
              </Select>

              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-ella-sage/30 border-ella-sage text-foreground placeholder:text-foreground/50 h-14"
                />
                <Input
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-ella-sage/30 border-ella-sage text-foreground placeholder:text-foreground/50 h-14"
                />
              </div>

              {/* Email */}
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-ella-sage/30 border-ella-sage text-foreground placeholder:text-foreground/50 h-14"
              />

              {/* Message */}
              <Textarea
                placeholder="Type your message here..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-ella-sage/30 border-ella-sage text-foreground placeholder:text-foreground/50 min-h-[120px] resize-none"
              />

              {/* Phone Section */}
              <div className="pt-4">
                <p className="text-foreground mb-3">
                  Enter your phone number if you would like to receive reminder messages.
                </p>
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-ella-sage/30 border-ella-sage text-foreground placeholder:text-foreground/50 h-14"
                />
                <p className="text-foreground/60 text-sm mt-3">
                  By signing up via text, you agree to receive reminder and other informative messages at the number provided. Message and data rates may apply. Message frequency varies. Reply STOP to cancel.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  className="bg-ella-sage hover:bg-ella-sage/90 text-foreground px-10 py-6 rounded-full text-base font-medium"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Contact;
