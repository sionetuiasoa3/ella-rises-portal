import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Trash2, Save, AlertTriangle } from 'lucide-react';
import participantsService from '@/services/participants';
import eventsService from '@/services/events';
import type { Registration } from '@/types/portal';

const Profile: React.FC = () => {
  const { participant, updateParticipant, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<Registration[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    ParticipantFirstName: participant?.ParticipantFirstName || '',
    ParticipantLastName: participant?.ParticipantLastName || '',
    ParticipantPhone: participant?.ParticipantPhone || '',
    ParticipantCity: participant?.ParticipantCity || '',
    ParticipantState: participant?.ParticipantState || '',
    ParticipantZip: participant?.ParticipantZip || '',
    ParticipantSchoolOrEmployer: participant?.ParticipantSchoolOrEmployer || '',
    ParticipantFieldOfInterest: participant?.ParticipantFieldOfInterest || 'Both',
  });

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await participantsService.uploadPhoto(file);
      if (participant) {
        updateParticipant({ ...participant, ParticipantPhotoPath: result.photoPath });
      }
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated.' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await participantsService.updateMe(formData);
      updateParticipant(updated);
      setIsEditing(false);
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    // Fetch upcoming events to show warning
    try {
      const events = await eventsService.getMyEvents();
      const upcoming = events.filter(
        (reg) => reg.Event && new Date(reg.Event.EventDateTimeStart) > new Date()
      );
      setUpcomingEvents(upcoming);
      setShowDeleteDialog(true);
    } catch (error) {
      setUpcomingEvents([]);
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await participantsService.deleteAccount();
      toast({ title: 'Account deleted', description: 'Your account has been deleted.' });
      logout();
      navigate('/portal/auth');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getInitials = () => {
    return `${participant?.ParticipantFirstName?.[0] || ''}${participant?.ParticipantLastName?.[0] || ''}`.toUpperCase();
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>

        {/* Profile Photo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Click on the photo to change it</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
              <Avatar className="h-24 w-24">
                <AvatarImage src={participant?.ParticipantPhotoPath || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {participant?.ParticipantFirstName} {participant?.ParticipantLastName}
              </h3>
              <p className="text-muted-foreground">{participant?.ParticipantEmail}</p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal details</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.ParticipantFirstName}
                    onChange={(e) => updateField('ParticipantFirstName', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground py-2">{participant?.ParticipantFirstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.ParticipantLastName}
                    onChange={(e) => updateField('ParticipantLastName', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground py-2">{participant?.ParticipantLastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-muted-foreground py-2">{participant?.ParticipantEmail}</p>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              {isEditing ? (
                <Input
                  value={formData.ParticipantPhone}
                  onChange={(e) => updateField('ParticipantPhone', e.target.value)}
                />
              ) : (
                <p className="text-foreground py-2">{participant?.ParticipantPhone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <p className="text-muted-foreground py-2">
                {participant?.ParticipantDOB
                  ? new Date(participant.ParticipantDOB).toLocaleDateString()
                  : 'Not set'}
              </p>
              <p className="text-xs text-muted-foreground">Date of birth cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label>Field of Interest</Label>
              {isEditing ? (
                <RadioGroup
                  value={formData.ParticipantFieldOfInterest}
                  onValueChange={(v) => updateField('ParticipantFieldOfInterest', v)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Arts" id="arts-edit" />
                    <Label htmlFor="arts-edit" className="cursor-pointer">Arts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STEM" id="stem-edit" />
                    <Label htmlFor="stem-edit" className="cursor-pointer">STEM</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Both" id="both-edit" />
                    <Label htmlFor="both-edit" className="cursor-pointer">Both</Label>
                  </div>
                </RadioGroup>
              ) : (
                <p className="text-foreground py-2">{participant?.ParticipantFieldOfInterest}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                {isEditing ? (
                  <Input
                    value={formData.ParticipantCity}
                    onChange={(e) => updateField('ParticipantCity', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground py-2">{participant?.ParticipantCity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                {isEditing ? (
                  <Input
                    value={formData.ParticipantState}
                    onChange={(e) => updateField('ParticipantState', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground py-2">{participant?.ParticipantState}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Zip</Label>
                {isEditing ? (
                  <Input
                    value={formData.ParticipantZip}
                    onChange={(e) => updateField('ParticipantZip', e.target.value)}
                  />
                ) : (
                  <p className="text-foreground py-2">{participant?.ParticipantZip}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>School or Employer</Label>
              {isEditing ? (
                <Input
                  value={formData.ParticipantSchoolOrEmployer}
                  onChange={(e) => updateField('ParticipantSchoolOrEmployer', e.target.value)}
                />
              ) : (
                <p className="text-foreground py-2">
                  {participant?.ParticipantSchoolOrEmployer || 'Not specified'}
                </p>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-4 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" onClick={handleDeleteClick}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action cannot be undone. Your login credentials will be removed
                      and you will no longer be able to access this account.
                    </p>
                    {upcomingEvents.length > 0 && (
                      <div className="bg-destructive/10 p-4 rounded-lg">
                        <p className="font-medium text-destructive mb-2">
                          Warning: You are registered for {upcomingEvents.length} upcoming event(s):
                        </p>
                        <ul className="text-sm list-disc list-inside">
                          {upcomingEvents.map((reg) => (
                            <li key={reg.RegistrationID}>{reg.Event?.EventName}</li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2">
                          These registrations will be cancelled.
                        </p>
                      </div>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Profile;
