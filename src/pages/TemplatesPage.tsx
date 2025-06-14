
import { useState, useMemo } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import TemplateCard from '@/components/TemplateCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TemplatesPage = () => {
  const { templates, loading } = useTemplates();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const categorySet = new Set(templates.map(template => template.category));
    return Array.from(categorySet);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleSelectTemplate = (template: any) => {
    // For now, just show a toast. In a real app, this would open the create project modal
    toast({
      title: "Template Selected",
      description: `You selected ${template.name}. Create a new project to use this template.`,
    });
    navigate('/projects');
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      'web_app': 'Web App',
      'mobile_app': 'Mobile App',
      'ecommerce': 'E-commerce',
      'cms': 'CMS',
      'saas': 'SaaS',
    };
    return labels[category as keyof typeof labels] || category;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Project Templates</h1>
              <p className="text-gray-600 mt-2">Choose from our collection of pre-built project templates to jumpstart your development.</p>
            </div>
            <Button onClick={() => navigate('/projects')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {getCategoryLabel(category)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No templates found</CardTitle>
              <CardDescription>
                {searchQuery || selectedCategory 
                  ? "Try adjusting your search or filter criteria."
                  : "No templates are available at the moment."
                }
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplatesPage;
