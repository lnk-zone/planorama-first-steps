
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProjectTemplate, useTemplates } from '@/hooks/useTemplates';
import TemplateCard from './TemplateCard';
import { Search, Filter, FileText } from 'lucide-react';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

const TemplateSelectionModal = ({ isOpen, onClose, onSelectTemplate }: TemplateSelectionModalProps) => {
  const { templates, loading } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTemplates = templates.filter((template) => {
    const searchTermLower = searchTerm.toLowerCase();
    const nameMatch = template.name.toLowerCase().includes(searchTermLower);
    const descriptionMatch = template.description?.toLowerCase().includes(searchTermLower);
    const categoryMatch = categoryFilter === 'all' || template.category === categoryFilter;

    return (nameMatch || descriptionMatch) && categoryMatch;
  });

  const handleStartFromScratch = () => {
    onSelectTemplate({
      id: 'scratch',
      name: 'Start from Scratch',
      description: 'Create a project without any pre-defined features',
      category: 'custom',
      features: [],
      is_public: true,
      created_by: null,
      created_at: null,
      updated_at: null
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Choose a Project Template</DialogTitle>
          <DialogDescription>
            Select a template to get started quickly, or start from scratch to build your own.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="web_app">Web App</SelectItem>
                <SelectItem value="mobile_app">Mobile App</SelectItem>
                <SelectItem value="ecommerce">E-commerce</SelectItem>
                <SelectItem value="cms">CMS</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Start from Scratch Option */}
              <div className="border-b pb-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">Start from Scratch</h3>
                      <p className="text-sm text-gray-600">Create a project without any pre-defined features</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleStartFromScratch}>
                    Start Fresh
                  </Button>
                </div>
              </div>

              {/* Template Cards */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Project Templates</h3>
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No templates found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={onSelectTemplate}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;
