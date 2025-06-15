
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Edit, Trash2, Eye, EyeOff, Search, Plus } from 'lucide-react';
import { useEnhancedTemplates, type EnhancedProjectTemplate } from '@/hooks/useEnhancedTemplates';
import { toast } from '@/hooks/use-toast';
import CreateTemplateModal from './CreateTemplateModal';

interface TemplateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateManagementModal = ({ isOpen, onClose }: TemplateManagementModalProps) => {
  const { deleteTemplate, updateTemplate, fetchUserTemplates } = useEnhancedTemplates();
  const [userTemplates, setUserTemplates] = useState<EnhancedProjectTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EnhancedProjectTemplate | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadUserTemplates = async () => {
    try {
      const templates = await fetchUserTemplates();
      setUserTemplates(templates);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your templates.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUserTemplates();
    }
  }, [isOpen]);

  const filteredTemplates = userTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      setUserTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({
        title: "Template Deleted",
        description: `"${templateName}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublic = async (template: EnhancedProjectTemplate) => {
    try {
      const updatedTemplate = await updateTemplate(template.id, {
        is_public: !template.is_public
      });
      
      setUserTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, is_public: updatedTemplate.is_public } : t
      ));
      
      toast({
        title: "Template Updated",
        description: `Template is now ${updatedTemplate.is_public ? 'public' : 'private'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template visibility.",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Templates
            </DialogTitle>
            <DialogDescription>
              Create, edit, and manage your project templates.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="my-templates" className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="my-templates">My Templates</TabsTrigger>
                <TabsTrigger value="create-new">Create New</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>
            </div>

            <TabsContent value="my-templates" className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchQuery ? 'No templates found' : 'No templates yet'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search criteria.'
                      : 'Create your first template to get started.'
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map(template => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{template.category}</Badge>
                              <Badge className={getDifficultyColor(template.difficulty_level)}>
                                {template.difficulty_level || 'beginner'}
                              </Badge>
                              {template.is_public ? (
                                <Badge variant="outline" className="text-green-600">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <CardDescription className="mb-4">
                          {template.description || 'No description provided'}
                        </CardDescription>
                        
                        <div className="space-y-2 mb-4">
                          {template.estimated_hours && (
                            <p className="text-sm text-gray-600">
                              Estimated: {template.estimated_hours} hours
                            </p>
                          )}
                          
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.tags.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublic(template)}
                          >
                            {template.is_public ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                Make Public
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingTemplate(template)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id, template.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="create-new" className="flex-1">
              <div className="text-center py-12">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Template</h3>
                <p className="text-gray-600 mb-6">
                  Start from scratch to create a custom project template.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          loadUserTemplates();
        }}
      />
    </>
  );
};

export default TemplateManagementModal;
