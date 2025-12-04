import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminParticipantsService, type Donation, type AdminRegistration } from '@/services/admin';
import type { Participant, Milestone } from '@/types/portal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, Calendar, Trophy, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const AdminParticipantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    ParticipantFirstName: '',
    ParticipantLastName: '',
    ParticipantEmail: '',
    ParticipantPhone: '',
    ParticipantCity: '',
    ParticipantState: '',
    ParticipantZip: '',
    ParticipantSchoolOrEmployer: '',
    ParticipantFieldOfInterest: 'Both' as 'Arts' | 'STEM' | 'Both',
  });

  useEffect(() => {
    if (id) {
      loadParticipant(parseInt(id));
    }
  }, [id]);

  const loadParticipant = async (participantId: number) => {
    try {
      const [participantData, regs, mils, dons] = await Promise.all([
        adminParticipantsService.getById(participantId),
        adminParticipantsService.getRegistrations(participantId),
        adminParticipantsService.getMilestones(participantId),
        adminParticipantsService.getDonations(participantId),
      ]);

      if (!participantData) {
        toast({ title: 'Error', description: 'Participant not found', variant: 'destructive' });
        navigate('/admin/participants');
        return;
      }

      setParticipant(participantData);
      setFormData({
        ParticipantFirstName: participantData.ParticipantFirstName,
        ParticipantLastName: participantData.ParticipantLastName,
        ParticipantEmail: participantData.ParticipantEmail,
        ParticipantPhone: participantData.ParticipantPhone,
        ParticipantCity: participantData.ParticipantCity,
        ParticipantState: participantData.ParticipantState,
        ParticipantZip: participantData.ParticipantZip,
        ParticipantSchoolOrEmployer: participantData.ParticipantSchoolOrEmployer || '',
        ParticipantFieldOfInterest: participantData.ParticipantFieldOfInterest,
      });
      setRegistrations(regs);
      setMilestones(mils);
      setDonations(dons);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load participant', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const updated = await adminParticipantsService.update(parseInt(id), formData);
      setParticipant(updated);
      toast({ title: 'Success', description: 'Participant updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update participant', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const totalDonations = donations.reduce((sum, d) => sum + d.DonationAmount, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!participant) return null;

  return (
    <div className="p-6 lg:p-8">
      <Button variant="ghost" onClick={() => navigate('/admin/participants')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Participants
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {participant.ParticipantFirstName} {participant.ParticipantLastName}
          </h1>
          <p className="text-muted-foreground">{participant.ParticipantEmail}</p>
        </div>
        <Badge variant={participant.ParticipantRole === 'admin' ? 'default' : 'secondary'}>
          {participant.ParticipantRole === 'admin' ? 'Admin' : 'Participant'}
        </Badge>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="events">Events ({registrations.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
          <TabsTrigger value="donations">Donations ({donations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Edit Participant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.ParticipantFirstName}
                    onChange={(e) => setFormData({ ...formData, ParticipantFirstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.ParticipantLastName}
                    onChange={(e) => setFormData({ ...formData, ParticipantLastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.ParticipantEmail}
                    onChange={(e) => setFormData({ ...formData, ParticipantEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.ParticipantPhone}
                    onChange={(e) => setFormData({ ...formData, ParticipantPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.ParticipantCity}
                    onChange={(e) => setFormData({ ...formData, ParticipantCity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.ParticipantState}
                    onChange={(e) => setFormData({ ...formData, ParticipantState: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.ParticipantZip}
                    onChange={(e) => setFormData({ ...formData, ParticipantZip: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="school">School/Employer</Label>
                  <Input
                    id="school"
                    value={formData.ParticipantSchoolOrEmployer}
                    onChange={(e) => setFormData({ ...formData, ParticipantSchoolOrEmployer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest">Field of Interest</Label>
                  <Select
                    value={formData.ParticipantFieldOfInterest}
                    onValueChange={(value: 'Arts' | 'STEM' | 'Both') =>
                      setFormData({ ...formData, ParticipantFieldOfInterest: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="STEM">STEM</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={isSaving} className="mt-6">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Registered Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No event registrations</p>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <div key={reg.RegistrationID} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Event #{reg.EventID}</p>
                        <p className="text-sm text-muted-foreground">
                          Registered: {format(new Date(reg.RegistrationCreatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reg.RegistrationAttendedFlag ? 'default' : 'secondary'}>
                          {reg.RegistrationAttendedFlag ? 'Attended' : 'Registered'}
                        </Badge>
                        {reg.SurveyCompleted && <Badge variant="outline">Survey Done</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" /> Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No milestones recorded</p>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <div key={milestone.MilestoneID} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{milestone.MilestoneTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(milestone.MilestoneDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Donation History
                </span>
                <span className="text-lg font-bold text-green-600">
                  Total: ${totalDonations.toLocaleString()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No donations recorded</p>
              ) : (
                <div className="space-y-4">
                  {donations.map((donation) => (
                    <div key={donation.DonationID} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">${donation.DonationAmount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(donation.DonationDate), 'MMMM d, yyyy')}
                        </p>
                        {donation.DonationNotes && (
                          <p className="text-sm text-muted-foreground mt-1">"{donation.DonationNotes}"</p>
                        )}
                      </div>
                      <Badge variant="outline">{donation.DonationFrequency}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminParticipantDetail;
