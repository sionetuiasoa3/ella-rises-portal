import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminEventTemplatesService, type EventTemplate } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CATEGORIES = ['Arts', 'STEM', 'Leadership', 'Community', 'Career'];

const AdminEventTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    TemplateName: '',
    TemplateDescription: '',
    TemplateCategory: 'Arts',
    TemplateDefaultCapacity: 25,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await adminEventTemplatesService.getAll();
      setTemplates(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData({
      TemplateName: '',
      TemplateDescription: '',
      TemplateCategory: 'Arts',
      TemplateDefaultCapacity: 25,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (template: EventTemplate) => {
    setEditingTemplate(template);
    setFormData({
      TemplateName: template.TemplateName,
      TemplateDescription: template.TemplateDescription,
      TemplateCategory: template.TemplateCategory,
      TemplateDefaultCapacity: template.TemplateDefaultCapacity,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.TemplateName.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        const updated = await adminEventTemplatesService.update(editingTemplate.TemplateID, formData);
        setTemplates((prev) =>
          prev.map((t) => (t.TemplateID === editingTemplate.TemplateID ? updated : t))
        );
        toast({ title: 'Success', description: 'Template updated successfully' });
      } else {
        const created = await adminEventTemplatesService.create(formData);
        setTemplates((prev) => [...prev, created]);
        toast({ title: 'Success', description: 'Template created successfully' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await adminEventTemplatesService.delete(deleteId);
      setTemplates((prev) => prev.filter((t) => t.TemplateID !== deleteId));
      toast({ title: 'Success', description: 'Template deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Event Templates</h1>
          <p className="text-muted-foreground">Manage reusable event categories</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No event templates yet</p>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.TemplateID} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{template.TemplateCategory}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(template)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(template.TemplateID)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-2">{template.TemplateName}</CardTitle>
                <CardDescription className="line-clamp-2">{template.TemplateDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Default Capacity: {template.TemplateDefaultCapacity}</span>
                </div>
                <Link to={`/admin/events?template=${template.TemplateID}`}>
                  <Button variant="outline" className="w-full mt-4">
                    View Events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.TemplateName}
                onChange={(e) => setFormData({ ...formData, TemplateName: e.target.value })}
                placeholder="e.g., Folklorico Dance Workshop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.TemplateDescription}
                onChange={(e) => setFormData({ ...formData, TemplateDescription: e.target.value })}
                placeholder="Describe what this event type is about..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.TemplateCategory}
                onValueChange={(value) => setFormData({ ...formData, TemplateCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Default Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.TemplateDefaultCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, TemplateDefaultCapacity: parseInt(e.target.value) || 0 })
                }
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event template. Events created from this template will remain but lose their template association.
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

export default AdminEventTemplates;
