import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { Award, Plus, Loader2, Pencil, Trash2, Calendar } from 'lucide-react';
import milestonesService, { MILESTONE_OPTIONS } from '@/services/milestones';
import type { Milestone, MilestoneType } from '@/types/portal';

const Milestones: React.FC = () => {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneTypes, setMilestoneTypes] = useState<MilestoneType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Milestone | null>(null);

  const [formData, setFormData] = useState({
    MilestoneID: 0,
    MilestoneDate: new Date().toISOString().split('T')[0],
    CustomLabel: '',
  });

  const OTHER_MILESTONE_ID = 999; // ID for "Other" option

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [milestonesData, typesData] = await Promise.all([
        milestonesService.getAll(),
        milestonesService.getMilestoneTypes().catch(() => {
          // If types endpoint doesn't exist, create from MILESTONE_OPTIONS
          return MILESTONE_OPTIONS.map((title, idx) => ({
            MilestoneID: title === 'Other' ? OTHER_MILESTONE_ID : idx + 1,
            MilestoneTitle: title,
          }));
        }),
      ]);
      setMilestones(milestonesData);
      setMilestoneTypes(typesData);
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
      // Use fallback milestone types
      setMilestoneTypes(
        MILESTONE_OPTIONS.map((title, idx) => ({
          MilestoneID: title === 'Other' ? OTHER_MILESTONE_ID : idx + 1,
          MilestoneTitle: title,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      MilestoneID: 0,
      MilestoneDate: new Date().toISOString().split('T')[0],
      CustomLabel: '',
    });
    setEditingMilestone(null);
  };

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditingMilestone(milestone);
      setFormData({
        MilestoneID: milestone.MilestoneID,
        MilestoneDate: milestone.MilestoneDate,
        CustomLabel: milestone.CustomLabel || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.MilestoneID) {
      toast({
        title: 'Please select a milestone',
        variant: 'destructive',
      });
      return;
    }

    if (formData.MilestoneID === OTHER_MILESTONE_ID && !formData.CustomLabel.trim()) {
      toast({
        title: 'Please enter a custom milestone name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingMilestone) {
        const updated = await milestonesService.update(editingMilestone.MilestoneID, {
          MilestoneDate: formData.MilestoneDate,
          CustomLabel: formData.CustomLabel || undefined,
        });
        setMilestones((prev) =>
          prev.map((m) =>
            m.MilestoneID === editingMilestone.MilestoneID &&
            m.MilestoneDate === editingMilestone.MilestoneDate
              ? updated
              : m
          )
        );
        toast({ title: 'Milestone updated' });
      } else {
        const newMilestone = await milestonesService.create({
          MilestoneID: formData.MilestoneID,
          MilestoneDate: formData.MilestoneDate,
          CustomLabel: formData.MilestoneID === OTHER_MILESTONE_ID ? formData.CustomLabel : undefined,
        });
        setMilestones((prev) => [...prev, newMilestone]);
        toast({ title: 'Milestone added' });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: editingMilestone ? 'Failed to update' : 'Failed to add',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await milestonesService.delete(deleteTarget.MilestoneID);
      setMilestones((prev) =>
        prev.filter(
          (m) =>
            !(
              m.MilestoneID === deleteTarget.MilestoneID &&
              m.MilestoneDate === deleteTarget.MilestoneDate
            )
        )
      );
      toast({ title: 'Milestone deleted' });
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const getMilestoneTitle = (milestone: Milestone) => {
    if (milestone.CustomLabel) return milestone.CustomLabel;
    if (milestone.MilestoneTitle) return milestone.MilestoneTitle;
    const type = milestoneTypes.find((t) => t.MilestoneID === milestone.MilestoneID);
    return type?.MilestoneTitle || 'Unknown';
  };

  const selectedIsOther = formData.MilestoneID === OTHER_MILESTONE_ID;

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Milestones</h1>
            <p className="text-muted-foreground">Track your achievements and progress</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}
                </DialogTitle>
                <DialogDescription>
                  {editingMilestone
                    ? 'Update the details of your milestone'
                    : 'Select a milestone and the date you achieved it'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Milestone Type</Label>
                  <Select
                    value={formData.MilestoneID.toString()}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, MilestoneID: parseInt(v) }))
                    }
                    disabled={!!editingMilestone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a milestone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {milestoneTypes.map((type) => (
                        <SelectItem key={type.MilestoneID} value={type.MilestoneID.toString()}>
                          {type.MilestoneTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedIsOther && (
                  <div className="space-y-2">
                    <Label>Custom Milestone Name</Label>
                    <Input
                      value={formData.CustomLabel}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, CustomLabel: e.target.value }))
                      }
                      placeholder="Enter your milestone name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Date Achieved</Label>
                  <Input
                    type="date"
                    value={formData.MilestoneDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, MilestoneDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingMilestone ? 'Save Changes' : 'Add Milestone'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : milestones.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                You haven't added any milestones yet
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {milestones
              .sort((a, b) => new Date(b.MilestoneDate).getTime() - new Date(a.MilestoneDate).getTime())
              .map((milestone) => (
                <Card key={`${milestone.MilestoneID}-${milestone.MilestoneDate}`}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-ella-sage/20 flex items-center justify-center">
                        <Award className="h-6 w-6 text-ella-sage" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{getMilestoneTitle(milestone)}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.MilestoneDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(milestone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(milestone)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget && getMilestoneTitle(deleteTarget)}"?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PortalLayout>
  );
};

export default Milestones;
