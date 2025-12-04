import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminParticipantsService } from '@/services/admin';
import type { Participant } from '@/types/portal';
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
import { Search, Trash2, Eye, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminParticipants: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredParticipants(
      participants.filter(
        (p) =>
          p.ParticipantFirstName.toLowerCase().includes(query) ||
          p.ParticipantLastName.toLowerCase().includes(query) ||
          p.ParticipantEmail.toLowerCase().includes(query) ||
          p.ParticipantCity.toLowerCase().includes(query) ||
          p.ParticipantFieldOfInterest.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, participants]);

  const loadParticipants = async () => {
    try {
      const data = await adminParticipantsService.getAll();
      setParticipants(data);
      setFilteredParticipants(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load participants', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminParticipantsService.delete(deleteId);
      setParticipants((prev) => prev.filter((p) => p.ParticipantID !== deleteId));
      toast({ title: 'Success', description: 'Participant deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete participant', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleAdmin = async (id: number) => {
    try {
      const updated = await adminParticipantsService.toggleAdmin(id);
      setParticipants((prev) =>
        prev.map((p) => (p.ParticipantID === id ? updated : p))
      );
      toast({
        title: 'Success',
        description: `Participant ${updated.ParticipantRole === 'admin' ? 'promoted to' : 'removed from'} admin`,
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Participant Management</h1>
        <p className="text-muted-foreground">View and manage all participants</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>All Participants ({filteredParticipants.length})</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No participants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <TableRow key={participant.ParticipantID}>
                        <TableCell className="font-medium">
                          {participant.ParticipantFirstName} {participant.ParticipantLastName}
                        </TableCell>
                        <TableCell>{participant.ParticipantEmail}</TableCell>
                        <TableCell>{participant.ParticipantCity}, {participant.ParticipantState}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.ParticipantFieldOfInterest}</Badge>
                        </TableCell>
                        <TableCell>
                          {participant.ParticipantRole === 'admin' ? (
                            <Badge className="bg-primary">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">Participant</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild title="View Details">
                              <Link to={`/admin/participants/${participant.ParticipantID}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleAdmin(participant.ParticipantID)}
                              title={participant.ParticipantRole === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            >
                              {participant.ParticipantRole === 'admin' ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <ShieldCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(participant.ParticipantID)}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Participant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the participant and all their associated data.
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

export default AdminParticipants;
