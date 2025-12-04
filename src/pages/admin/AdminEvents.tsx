import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminEventsService, adminEventTemplatesService, type AdminEvent, type EventTemplate } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AdminEvents: React.FC = () => {
  const [searchParams] = useSearchParams();
  const templateFilter = searchParams.get('template');

  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AdminEvent[]>([]);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateFilter || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    EventName: '',
    TemplateID: 1,
    EventDateTimeStart: '',
    EventDateTimeEnd: '',
    EventLocation: '',
    EventCapacity: 25,
    EventRegistrationDeadline: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (selectedTemplate !== 'all') {
      filtered = filtered.filter((e) => e.TemplateID === parseInt(selectedTemplate));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.EventName.toLowerCase().includes(query) ||
          e.EventLocation.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  }, [searchQuery, selectedTemplate, events]);

  const loadData = async () => {
    try {
      const [eventsData, templatesData] = await Promise.all([
        adminEventsService.getAll(),
        adminEventTemplatesService.getAll(),
      ]);
      setEvents(eventsData);
      setFilteredEvents(eventsData);
      setTemplates(templatesData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateName = (templateId: number) => {
    return templates.find((t) => t.TemplateID === templateId)?.TemplateName || 'Unknown';
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    const now = new Date();
    const defaultStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
    const deadline = new Date(defaultStart.getTime() - 2 * 24 * 60 * 60 * 1000);

    setFormData({
      EventName: '',
      TemplateID: templates[0]?.TemplateID || 1,
      EventDateTimeStart: defaultStart.toISOString().slice(0, 16),
      EventDateTimeEnd: defaultEnd.toISOString().slice(0, 16),
      EventLocation: '',
      EventCapacity: templates[0]?.TemplateDefaultCapacity || 25,
      EventRegistrationDeadline: deadline.toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const openEditDialog = (event: AdminEvent) => {
    setEditingEvent(event);
    setFormData({
      EventName: event.EventName,
      TemplateID: event.TemplateID,
      EventDateTimeStart: new Date(event.EventDateTimeStart).toISOString().slice(0, 16),
      EventDateTimeEnd: new Date(event.EventDateTimeEnd).toISOString().slice(0, 16),
      EventLocation: event.EventLocation,
      EventCapacity: event.EventCapacity,
      EventRegistrationDeadline: new Date(event.EventRegistrationDeadline).toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.EventName.trim() || !formData.EventLocation.trim()) {
      toast({ title: 'Error', description: 'Name and location are required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const eventData = {
        ...formData,
        EventDateTimeStart: new Date(formData.EventDateTimeStart).toISOString(),
        EventDateTimeEnd: new Date(formData.EventDateTimeEnd).toISOString(),
        EventRegistrationDeadline: new Date(formData.EventRegistrationDeadline).toISOString(),
        EventPhotoPath: null,
      };

      if (editingEvent) {
        const updated = await adminEventsService.update(editingEvent.EventID, eventData);
        setEvents((prev) => prev.map((e) => (e.EventID === editingEvent.EventID ? updated : e)));
        toast({ title: 'Success', description: 'Event updated successfully' });
      } else {
        const created = await adminEventsService.create(eventData);
        setEvents((prev) => [...prev, created]);
        toast({ title: 'Success', description: 'Event created successfully' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save event', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminEventsService.delete(deleteId);
      setEvents((prev) => prev.filter((e) => e.EventID !== deleteId));
      toast({ title: 'Success', description: 'Event deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete event', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const isPastEvent = (date: string) => new Date(date) < new Date();

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-muted-foreground">Create and manage events</p>
        </div>
        <Button onClick={openCreateDialog} disabled={templates.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>All Events ({filteredEvents.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.TemplateID} value={t.TemplateID.toString()}>
                      {t.TemplateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEvents.map((event) => (
                      <TableRow key={event.EventID} className={isPastEvent(event.EventDateTimeStart) ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          {event.EventName}
                          {isPastEvent(event.EventDateTimeStart) && (
                            <Badge variant="secondary" className="ml-2">Past</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTemplateName(event.TemplateID)}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(event.EventDateTimeStart), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>{event.EventLocation}</TableCell>
                        <TableCell>{event.EventCapacity}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild title="View Registrations">
                              <Link to={`/admin/events/${event.EventID}/registrations`}>
                                <Users className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(event.EventID)}
                              className="text-destructive hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="template">Event Template</Label>
              <Select
                value={formData.TemplateID.toString()}
                onValueChange={(v) => setFormData({ ...formData, TemplateID: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.TemplateID} value={t.TemplateID.toString()}>
                      {t.TemplateName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={formData.EventName}
                onChange={(e) => setFormData({ ...formData, EventName: e.target.value })}
                placeholder="e.g., Spring Folklorico Workshop"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date & Time</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={formData.EventDateTimeStart}
                  onChange={(e) => setFormData({ ...formData, EventDateTimeStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date & Time</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={formData.EventDateTimeEnd}
                  onChange={(e) => setFormData({ ...formData, EventDateTimeEnd: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.EventLocation}
                onChange={(e) => setFormData({ ...formData, EventLocation: e.target.value })}
                placeholder="e.g., Community Center, Salt Lake City"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.EventCapacity}
                  onChange={(e) => setFormData({ ...formData, EventCapacity: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Registration Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.EventRegistrationDeadline}
                  onChange={(e) => setFormData({ ...formData, EventRegistrationDeadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event and all associated registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEvents;
