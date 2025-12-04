import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Heart, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import ellaLogo from '@/assets/ella-rises-logo.png';

type DonationFrequency = 'one-time' | 'monthly' | 'quarterly' | 'yearly';

const PRESET_AMOUNTS = [1000, 500, 250, 100, 55, 25];
const FUNDRAISING_GOAL = 100000;
const CURRENT_RAISED = 981; // This would come from API

const Donate: React.FC = () => {
  const { participant } = useAuth();
  const navigate = useNavigate();
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
    // Only allow numbers and decimal point
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

    // Mock API call - this would go to your backend
    try {
      // In real implementation, this would:
      // 1. Create a donation record in your database
      // 2. Redirect to payment processor or handle payment
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Thank you!',
        description: `Your ${frequency} donation of $${actualAmount} is being processed.`,
      });

      // For now, just show success - in production, redirect to payment
      navigate('/portal/dashboard');
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
    <PortalLayout>
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
                Rise With Ella: Empowering Futures Together
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
                className={`pl-8 pr-16 h-12 text-lg ${
                  customAmount ? 'border-foreground' : ''
                }`}
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
    </PortalLayout>
  );
};

export default Donate;
