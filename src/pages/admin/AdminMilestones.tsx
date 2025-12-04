import React, { useEffect, useState } from 'react';
import { adminMilestoneTypesService } from '@/services/admin';
import type { MilestoneType } from '@/types/portal';
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
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminMilestones: React.FC = () => {
  const [milestoneTypes, setMilestoneTypes] = useState<MilestoneType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<MilestoneType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<MilestoneType | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMilestoneTypes();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredTypes(milestoneTypes);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredTypes(milestoneTypes.filter((t) => t.MilestoneTitle.toLowerCase().includes(query)));
  }, [searchQuery, milestoneTypes]);

  const loadMilestoneTypes = async () => {
    try {
      const data = await adminMilestoneTypesService.getAll();
      setMilestoneTypes(data);
      setFilteredTypes(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load milestone types', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingType(null);
    setTitle('');
    setDialogOpen(true);
  };

  const openEditDialog = (type: MilestoneType) => {
    setEditingType(type);
    setTitle(type.MilestoneTitle);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingType) {
        const updated = await adminMilestoneTypesService.update(editingType.MilestoneID, title);
        setMilestoneTypes((prev) =>
          prev.map((t) => (t.MilestoneID === editingType.MilestoneID ? updated : t))
        );
        toast({ title: 'Success', description: 'Milestone title updated' });
      } else {
        const created = await adminMilestoneTypesService.create(title);
        setMilestoneTypes((prev) => [...prev, created]);
        toast({ title: 'Success', description: 'Milestone title created' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminMilestoneTypesService.delete(deleteId);
      setMilestoneTypes((prev) => prev.filter((t) => t.MilestoneID !== deleteId));
      toast({ title: 'Success', description: 'Milestone title deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Milestone Titles</h1>
          <p className="text-muted-foreground">Manage available milestone options for participants</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Title
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <CardTitle>All Milestone Titles ({filteredTypes.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search titles..."
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
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No milestone titles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTypes.map((type) => (
                      <TableRow key={type.MilestoneID}>
                        <TableCell className="text-muted-foreground">{type.MilestoneID}</TableCell>
                        <TableCell className="font-medium">{type.MilestoneTitle}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(type.MilestoneID)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Milestone Title' : 'Add Milestone Title'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., High School Diploma"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingType ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone Title?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this option from the milestone dropdown. Existing milestones with this title will not be affected.
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

export default AdminMilestones;
