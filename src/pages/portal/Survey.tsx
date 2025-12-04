import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, Star } from 'lucide-react';
import eventsService from '@/services/events';
import surveysService, { calculateNPSBucket } from '@/services/surveys';
import type { Event, Survey as SurveyType, SurveySubmission } from '@/types/portal';

const RATING_LABELS = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];

const Survey: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [existingSurvey, setExistingSurvey] = useState<SurveyType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

const [formData, setFormData] = useState<SurveySubmission>({
    SurveySatisfactionScore: 0,
    SurveyUsefulnessScore: 0,
    SurveyInstructorScore: 0,
    SurveyRecommendationScore: 0,
    SurveyOverallScore: 0,
    SurveyComments: '',
  });

  // Auto-calculate overall score as average of first 4 scores
  const calculatedOverallScore = Math.round(
    (formData.SurveySatisfactionScore +
      formData.SurveyUsefulnessScore +
      formData.SurveyInstructorScore +
      formData.SurveyRecommendationScore) / 4
  );

  useEffect(() => {
    if (!eventId) return;
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventData, surveyData] = await Promise.all([
        eventsService.getById(parseInt(eventId!)),
        surveysService.getMySurvey(parseInt(eventId!)),
      ]);
      setEvent(eventData);
      setExistingSurvey(surveyData);

      if (surveyData) {
        setFormData({
          SurveySatisfactionScore: surveyData.SurveySatisfactionScore,
          SurveyUsefulnessScore: surveyData.SurveyUsefulnessScore,
          SurveyInstructorScore: surveyData.SurveyInstructorScore,
          SurveyRecommendationScore: surveyData.SurveyRecommendationScore,
          SurveyOverallScore: surveyData.SurveyOverallScore,
          SurveyComments: surveyData.SurveyComments || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load survey data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate first 4 scores are filled (overall is auto-calculated)
    const scores = [
      formData.SurveySatisfactionScore,
      formData.SurveyUsefulnessScore,
      formData.SurveyInstructorScore,
      formData.SurveyRecommendationScore,
    ];

    if (scores.some((score) => score === 0)) {
      toast({
        title: 'Please complete all ratings',
        description: 'All questions must be answered before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit with auto-calculated overall score
      await surveysService.submit(parseInt(eventId!), {
        ...formData,
        SurveyOverallScore: calculatedOverallScore,
      });
toast({ title: 'Survey submitted!', description: 'Thank you for your feedback.' });
      navigate('/portal/events');
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateScore = (field: keyof SurveySubmission, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const RatingQuestion = ({
    label,
    description,
    field,
    value,
    disabled,
  }: {
    label: string;
    description?: string;
    field: keyof SurveySubmission;
    value: number;
    disabled?: boolean;
  }) => (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <RadioGroup
        value={(value ?? 0).toString()}
        onValueChange={(v) => updateScore(field, parseInt(v))}
        className="flex gap-2 flex-wrap"
        disabled={disabled}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <div key={rating} className="flex flex-col items-center gap-1">
            <RadioGroupItem
              value={rating.toString()}
              id={`${field}-${rating}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${field}-${rating}`}
              className={`
                flex items-center justify-center w-12 h-12 rounded-full border-2 cursor-pointer
                transition-all peer-disabled:cursor-not-allowed peer-disabled:opacity-50
                ${
                  value === rating
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 hover:border-primary/50'
                }
              `}
            >
              {rating}
            </Label>
            <span className="text-xs text-muted-foreground text-center">
              {RATING_LABELS[rating - 1]}
            </span>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PortalLayout>
    );
  }

if (!event) {
    return (
      <PortalLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Event not found</p>
            <Button asChild>
              <Link to="/portal/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </PortalLayout>
    );
  }

  // Check if event has occurred (survey only available after event ends)
  const eventHasOccurred = new Date(event.EventDateTimeEnd) < new Date();

  if (!eventHasOccurred && !existingSurvey) {
    return (
      <PortalLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium mb-2">Survey Not Available Yet</p>
            <p className="text-muted-foreground mb-4">
              The survey for "{event.EventName}" will be available after the event has occurred.
            </p>
            <Button asChild>
              <Link to="/portal/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </PortalLayout>
    );
  }

  const isReadOnly = !!existingSurvey;

  return (
    <PortalLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/portal/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Event Survey
                </CardTitle>
                <CardDescription>{event.EventName}</CardDescription>
              </div>
              {isReadOnly && (
                <Badge className="bg-ella-sage text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isReadOnly && existingSurvey && (
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground">
                  You submitted this survey on{' '}
                  {new Date(existingSurvey.SurveySubmissionDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm mt-1">
                  <span className="font-medium">NPS Category: </span>
                  <Badge variant="outline">{existingSurvey.SurveyNPSBucket}</Badge>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <RatingQuestion
                label="1. Overall, how satisfied were you with this event?"
                field="SurveySatisfactionScore"
                value={formData.SurveySatisfactionScore}
                disabled={isReadOnly}
              />

              <RatingQuestion
                label="2. How useful or valuable was this event for you personally?"
                field="SurveyUsefulnessScore"
                value={formData.SurveyUsefulnessScore}
                disabled={isReadOnly}
              />

              <RatingQuestion
                label="3. How would you rate the instructor/facilitator?"
                description="Consider their knowledge, clarity, and engagement"
                field="SurveyInstructorScore"
                value={formData.SurveyInstructorScore}
                disabled={isReadOnly}
              />

              <RatingQuestion
                label="4. How likely are you to recommend this event to a friend?"
                field="SurveyRecommendationScore"
                value={formData.SurveyRecommendationScore}
                disabled={isReadOnly}
              />

              {/* Auto-calculated overall score display */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <Label className="text-base font-medium">Overall Score (Auto-calculated)</Label>
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                    {isReadOnly ? existingSurvey?.SurveyOverallScore : calculatedOverallScore || '-'}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Average of your ratings above
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">
                  5. What suggestions or comments do you have to help improve future events?
                </Label>
                <Textarea
                  value={formData.SurveyComments}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, SurveyComments: e.target.value }))
                  }
                  placeholder="Share your thoughts..."
                  rows={4}
                  disabled={isReadOnly}
                />
              </div>

              {!isReadOnly && (
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Survey
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Survey;
