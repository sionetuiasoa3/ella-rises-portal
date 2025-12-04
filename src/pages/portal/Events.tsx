import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import eventsService from '@/services/events';
import type { Event, Registration } from '@/types/portal';

const PortalEvents: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsData, registrationsData] = await Promise.all([
        eventsService.getAll(),
        eventsService.getMyEvents(),
      ]);
      setEvents(eventsData);
      setMyRegistrations(registrationsData);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (eventId: number) => {
    setActionLoading(eventId);
    try {
      const registration = await eventsService.register(eventId);
      setMyRegistrations((prev) => [...prev, registration]);
      setEvents((prev) =>
        prev.map((e) => (e.EventID === eventId ? { ...e, isRegistered: true } : e))
      );
      toast({ title: 'Registered!', description: 'You have been registered for this event.' });
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (eventId: number) => {
    setActionLoading(eventId);
    try {
      await eventsService.unregister(eventId);
      setMyRegistrations((prev) => prev.filter((r) => r.EventID !== eventId));
      setEvents((prev) =>
        prev.map((e) => (e.EventID === eventId ? { ...e, isRegistered: false } : e))
      );
      toast({ title: 'Unregistered', description: 'You have been removed from this event.' });
    } catch (error) {
      toast({
        title: 'Unregister failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isEventPast = (event: Event) => new Date(event.EventDateTimeEnd) < new Date();
  const isRegistrationClosed = (event: Event) =>
    new Date(event.EventRegistrationDeadline) < new Date();

  const myEventIds = new Set(myRegistrations.map((r) => r.EventID));

  // Filter events based on search
  const filteredEvents = events.filter(
    (event) =>
      event.EventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.EventLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize events
  const allEvents = filteredEvents.sort(
    (a, b) => new Date(a.EventDateTimeStart).getTime() - new Date(b.EventDateTimeStart).getTime()
  );

  const myUpcomingEvents = filteredEvents
    .filter((e) => myEventIds.has(e.EventID) && !isEventPast(e))
    .sort((a, b) => new Date(a.EventDateTimeStart).getTime() - new Date(b.EventDateTimeStart).getTime());

  const myPastEvents = filteredEvents
    .filter((e) => myEventIds.has(e.EventID) && isEventPast(e))
    .sort((a, b) => new Date(b.EventDateTimeStart).getTime() - new Date(a.EventDateTimeStart).getTime());

  const EventCard = ({ event, showSurvey = false }: { event: Event; showSurvey?: boolean }) => {
    const isPast = isEventPast(event);
    const isRegistered = myEventIds.has(event.EventID);
    const registrationClosed = isRegistrationClosed(event);

    return (
      <Card className={isPast ? 'opacity-75' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{event.EventName}</CardTitle>
            <div className="flex gap-1 flex-shrink-0">
              {isPast && <Badge variant="secondary">Past</Badge>}
              {isRegistered && (
                <Badge className="bg-ella-sage text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Registered
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.EventDateTimeStart)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {formatTime(event.EventDateTimeStart)} - {formatTime(event.EventDateTimeEnd)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.EventLocation}</span>
            </div>
            {event.spotsRemaining !== undefined && !isPast && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{event.spotsRemaining} spots remaining</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {isPast ? (
              isRegistered && showSurvey ? (
                <Button asChild size="sm">
                  <Link to={`/portal/survey/${event.EventID}`}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Fill Survey
                  </Link>
                </Button>
              ) : null
            ) : isRegistered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnregister(event.EventID)}
                disabled={actionLoading === event.EventID}
              >
                {actionLoading === event.EventID ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Unregister
              </Button>
            ) : registrationClosed ? (
              <Badge variant="secondary">Registration Closed</Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => handleRegister(event.EventID)}
                disabled={actionLoading === event.EventID}
              >
                {actionLoading === event.EventID ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Register
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <Card>
      <CardContent className="py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Browse and register for upcoming events</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="upcoming">My Upcoming</TabsTrigger>
              <TabsTrigger value="past">My Past</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {allEvents.length === 0 ? (
                <EmptyState message="No events found" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {allEvents.map((event) => (
                    <EventCard key={event.EventID} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {myUpcomingEvents.length === 0 ? (
                <EmptyState message="You have no upcoming events. Browse 'All Events' to register!" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myUpcomingEvents.map((event) => (
                    <EventCard key={event.EventID} event={event} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {myPastEvents.length === 0 ? (
                <EmptyState message="You have no past events yet" />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myPastEvents.map((event) => (
                    <EventCard key={event.EventID} event={event} showSurvey />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PortalLayout>
  );
};

export default PortalEvents;
