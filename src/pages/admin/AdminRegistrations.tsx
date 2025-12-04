import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminRegistrationsService, adminEventsService, type AdminRegistration, type AdminEvent } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AdminRegistrations: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<AdminRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (eventId) {
      loadData(parseInt(eventId));
    }
  }, [eventId]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredRegistrations(registrations);
      return;
    }

    const query = searchQuery.toLowerCase();
    setFilteredRegistrations(
      registrations.filter(
        (r) =>
          r.Participant?.ParticipantFirstName.toLowerCase().includes(query) ||
          r.Participant?.ParticipantLastName.toLowerCase().includes(query) ||
          r.Participant?.ParticipantEmail.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, registrations]);

  const loadData = async (id: number) => {
    try {
      const [eventsData, regsData] = await Promise.all([
        adminEventsService.getAll(),
        adminRegistrationsService.getByEvent(id),
      ]);

      const foundEvent = eventsData.find((e) => e.EventID === id);
      if (!foundEvent) {
        toast({ title: 'Error', description: 'Event not found', variant: 'destructive' });
        navigate('/admin/events');
        return;
      }

      setEvent(foundEvent);
      setRegistrations(regsData);
      setFilteredRegistrations(regsData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = async (registration: AdminRegistration) => {
    try {
      const updated = await adminRegistrationsService.update(registration.RegistrationID, {
        RegistrationAttendedFlag: !registration.RegistrationAttendedFlag,
        RegistrationCheckInTime: !registration.RegistrationAttendedFlag ? new Date().toISOString() : null,
      });
      setRegistrations((prev) =>
        prev.map((r) => (r.RegistrationID === registration.RegistrationID ? { ...r, ...updated } : r))
      );
      toast({ title: 'Success', description: 'Attendance updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update attendance', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminRegistrationsService.delete(deleteId);
      setRegistrations((prev) => prev.filter((r) => r.RegistrationID !== deleteId));
      toast({ title: 'Success', description: 'Registration removed' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete registration', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="p-6 lg:p-8">
      <Button variant="ghost" onClick={() => navigate('/admin/events')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Events
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{event.EventName}</h1>
        <p className="text-muted-foreground">
          {format(new Date(event.EventDateTimeStart), 'MMMM d, yyyy h:mm a')} • {event.EventLocation}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>
              Registrations ({filteredRegistrations.length} / {event.EventCapacity})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search registrants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Attended</TableHead>
                  <TableHead>Survey</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No registrations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.RegistrationID}>
                      <TableCell className="font-medium">
                        {reg.Participant?.ParticipantFirstName} {reg.Participant?.ParticipantLastName}
                      </TableCell>
                      <TableCell>{reg.Participant?.ParticipantEmail}</TableCell>
                      <TableCell>{format(new Date(reg.RegistrationCreatedAt), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAttendance(reg)}
                          className={reg.RegistrationAttendedFlag ? 'text-green-600' : 'text-muted-foreground'}
                        >
                          {reg.RegistrationAttendedFlag ? (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" /> Yes
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-4 w-4" /> No
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {reg.SurveyCompleted ? (
                          <Badge variant="default">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(reg.RegistrationID)}
                          className="text-destructive hover:text-destructive"
                          title="Remove Registration"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Registration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the participant from this event. They will need to register again if they want to attend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRegistrations;
