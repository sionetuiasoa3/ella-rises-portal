import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Heart, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import ellaLogo from "@/assets/ella-rises-logo.png";

// Sponsor logos
import metaLogo from "@/assets/sponsors/meta.jpg";
import uvuLogo from "@/assets/sponsors/uvu-creative-learning.png";
import thanksgivingPointLogo from "@/assets/sponsors/thanksgiving-point.png";

type DonationFrequency = 'one-time' | 'monthly' | 'quarterly' | 'yearly';

const PRESET_AMOUNTS = [1000, 500, 250, 100, 55, 25];
const FUNDRAISING_GOAL = 100000;
const CURRENT_RAISED = 981;

const Donate = () => {
  const { toast } = useToast();
  const [frequency, setFrequency] = useState<DonationFrequency>('one-time');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const actualAmount = customAmount ? parseFloat(customAmount) : selectedAmount;
  const progressPercent = Math.min((CURRENT_RAISED / FUNDRAISING_GOAL) * 100, 100);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setCustomAmount(sanitized);
    setSelectedAmount(null);
  };

  const handleContinue = async () => {
    if (!actualAmount || actualAmount <= 0) {
      toast({
        title: 'Please select an amount',
        description: 'Choose a preset amount or enter a custom amount.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Thank you!',
        description: `Your ${frequency} donation of $${actualAmount} is being processed.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not process donation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const frequencyOptions: { value: DonationFrequency; label: string }[] = [
    { value: 'one-time', label: 'One-time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-br from-ella-cream via-muted/40 to-ella-blush/30" />
        
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground/80 px-5 py-2.5 rounded-full mb-8 text-sm font-medium">
              <Heart className="h-4 w-4 text-primary" />
              Make a Difference
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Rise With{" "}
              <span className="italic text-primary">Ella</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
              Your generosity helps us continue empowering young women through transformative programs and opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* Main Donation Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left side - Campaign info */}
              <div className="space-y-6">
                <div className="bg-ella-blush rounded-2xl p-8 flex items-center justify-center">
                  <img src={ellaLogo} alt="Ella Rises" className="w-64 h-auto" />
                </div>

                {/* Progress bar */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold">${CURRENT_RAISED.toLocaleString()}</span>
                    <span className="text-muted-foreground">{progressPercent.toFixed(0)}% of ${FUNDRAISING_GOAL.toLocaleString()} goal</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-ella-sage rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Campaign description */}
                <div className="space-y-3">
                  <h2 className="text-2xl font-serif font-medium text-foreground">
                    Empowering Futures Together
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We believe in the power of community and the brilliance of our youth. 
                    Your donation helps provide STEAM education, arts programs, and mentorship 
                    opportunities to young women across our community.
                  </p>
                </div>
              </div>

              {/* Right side - Donation form */}
              <div className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="h-5 w-5 text-ella-sage" />
                  <span className="font-semibold text-foreground">Choose amount</span>
                </div>

                {/* Frequency selector */}
                <div className="flex rounded-lg border border-border p-1 mb-6">
                  {frequencyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFrequency(option.value)}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                        frequency === option.value
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Preset amounts */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRESET_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountSelect(amount)}
                      className={`py-3 px-4 rounded-lg border text-center font-medium transition-all ${
                        selectedAmount === amount && !customAmount
                          ? 'border-foreground bg-foreground/5 text-foreground'
                          : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground'
                      }`}
                    >
                      ${amount.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="text"
                    placeholder="Other"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className={`pl-8 pr-16 h-12 text-lg ${customAmount ? 'border-foreground' : ''}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">USD</span>
                </div>

                {/* Add comment checkbox */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="add-comment"
                      checked={showComment}
                      onCheckedChange={(checked) => setShowComment(checked === true)}
                    />
                    <Label htmlFor="add-comment" className="text-sm text-muted-foreground cursor-pointer">
                      Add note/comment
                    </Label>
                  </div>
                </div>

                {/* Comment textarea */}
                {showComment && (
                  <div className="mb-6 animate-fade-in">
                    <Textarea
                      placeholder="Share why you're donating or leave a message of support..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {comment.length}/500
                    </p>
                  </div>
                )}

                {/* Continue button */}
                <Button
                  onClick={handleContinue}
                  disabled={isLoading || !actualAmount || actualAmount <= 0}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                {/* Summary */}
                {actualAmount && actualAmount > 0 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    {frequency === 'one-time' 
                      ? `One-time donation of $${actualAmount.toLocaleString()}`
                      : `$${actualAmount.toLocaleString()} ${frequency} donation`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Ways to Help */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-6">
            Other Ways to Help
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-10 text-lg">
            Beyond financial contributions, there are many ways to support our mission.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { title: "Become a Mentor", description: "Share your experience and guide young women on their journey." },
              { title: "Volunteer", description: "Help us organize events and workshops in your community." },
              { title: "Spread the Word", description: "Share our mission with friends, family, and on social media." },
            ].map((item, index) => (
              <Card key={index} className="bg-card border-0 shadow-lg rounded-2xl">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-serif text-foreground mb-3">{item.title}</h3>
                  <p className="text-foreground/60">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Thank You Sponsors Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-serif text-foreground mb-6">
            THANK YOU
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto mb-4 text-lg">
            A big thank you to our supporters who make it possible for us to accomplish our goals and provide these wonderful programs for our young women!
          </p>
          <p className="text-foreground font-semibold mb-12">
            Your generous contributions have lasting impact.
          </p>
          
          {/* Sponsor Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 max-w-4xl mx-auto">
            <img 
              src={uvuLogo} 
              alt="UVU Creative Learning Studio" 
              className="h-20 md:h-24 object-contain"
            />
            <img 
              src={metaLogo} 
              alt="Meta" 
              className="h-12 md:h-16 object-contain"
            />
            <img 
              src={thanksgivingPointLogo} 
              alt="Thanksgiving Point" 
              className="h-20 md:h-24 object-contain"
            />
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Donate;
