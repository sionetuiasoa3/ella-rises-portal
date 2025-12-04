import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Award, Sparkles, ArrowRight, Loader2, Heart, TrendingUp } from 'lucide-react';
import eventsService from '@/services/events';
import milestonesService from '@/services/milestones';
import type { Registration, Milestone } from '@/types/portal';

const Dashboard: React.FC = () => {
  const { participant } = useAuth();
  const [myEvents, setMyEvents] = useState<Registration[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, milestonesData] = await Promise.all([
          eventsService.getMyEvents(),
          milestonesService.getAll(),
        ]);
        setMyEvents(eventsData);
        setMilestones(milestonesData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const upcomingEvents = myEvents.filter(
    (reg) => reg.Event && new Date(reg.Event.EventDateTimeStart) > new Date()
  );

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Dashboard</p>
              <h1 className="text-4xl font-serif font-medium text-foreground">
                Welcome back, {participant?.ParticipantFirstName}
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Your Ella Rises journey at a glance
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-ella-sage" />
              <span>Keep growing</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming Events</p>
                    <p className="text-4xl font-light mt-2 text-foreground">{upcomingEvents.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">registered</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Milestones</p>
                    <p className="text-4xl font-light mt-2 text-foreground">{milestones.length}</p>
                    <p className="text-sm text-muted-foreground mt-1">achieved</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center">
                    <Award className="h-5 w-5 text-secondary-foreground" />
                  </div>
                </div>
              </div>

              <div className="group relative bg-card border border-border rounded-xl p-6 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Focus Area</p>
                    <p className="text-2xl font-medium mt-2 text-foreground">
                      {participant?.ParticipantFieldOfInterest || 'Not set'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">field of interest</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Events */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Upcoming Events</h2>
                      <p className="text-sm text-muted-foreground">Your registered events</p>
                    </div>
                    <Link 
                      to="/portal/events" 
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No upcoming events</p>
                      <Button asChild size="sm">
                        <Link to="/portal/events">Browse Events</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 3).map((reg) => (
                        <div
                          key={reg.RegistrationID}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground truncate">{reg.Event?.EventName}</h4>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {reg.Event?.EventDateTimeStart
                                ? new Date(reg.Event.EventDateTimeStart).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : 'TBD'}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-4 shrink-0">
                            {reg.RegistrationStatus || 'Registered'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Milestones */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Your Milestones</h2>
                      <p className="text-sm text-muted-foreground">Track your achievements</p>
                    </div>
                    <Link 
                      to="/portal/milestones" 
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {milestones.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Award className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">No milestones yet</p>
                      <Button asChild size="sm">
                        <Link to="/portal/milestones">Add Milestone</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {milestones.slice(0, 4).map((milestone) => (
                        <div
                          key={`${milestone.MilestoneID}-${milestone.MilestoneDate}`}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-full bg-secondary/30 flex items-center justify-center shrink-0">
                            <Award className="h-4 w-4 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-foreground text-sm truncate">
                              {milestone.MilestoneTitle || milestone.CustomLabel}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(milestone.MilestoneDate).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Support CTA */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary border border-primary/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
              <div className="relative flex flex-col md:flex-row items-center justify-between p-8 gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Support Ella Rises</h3>
                    <p className="text-white/80 mt-1">
                      Help us empower more young women in STEAM
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shrink-0">
                  <a
                    href="https://givebutter.com/EllaRises"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Donate Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
};

export default Dashboard;
