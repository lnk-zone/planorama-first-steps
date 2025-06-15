
import { useState, useMemo } from 'react';
import { useTemplates } from '@/hooks/useTemplates';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import TemplateCard from '@/components/TemplateCard';
import TemplateManagementModal from '@/components/TemplateManagementModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Filter, Settings, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const TemplatesPage = () => {
  const { templates, loading } = useTemplates();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  const categories = useMemo(() => {
    const categorySet = new Set(templates.map(template => template.category));
    return Array.from(categorySet);
  }, [templates]);

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || template.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || template.difficulty_level === selectedDifficulty;
      const matchesFeatured = !showFeaturedOnly || template.is_featured;
      
      return matchesSearch && matchesCategory && matchesDifficulty && matchesFeatured;
    });
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, showFeaturedOnly]);

  const handleSelectTemplate = (template: any) => {
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

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setShowFeaturedOnly(false);
    setSearchQuery('');
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
              <p className="text-gray-600 mt-2">
                Choose from our collection of {templates.length} templates to jumpstart your development.
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsManagementModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Manage Templates
              </Button>
              <Button onClick={() => navigate('/projects')} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-500" />
              
              {/* Featured Filter */}
              <Badge
                variant={showFeaturedOnly ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              >
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
              
              {/* Category Filter */}
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
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
              
              {/* Difficulty Filter */}
              {difficulties.map(difficulty => (
                <Badge
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setSelectedDifficulty(difficulty)}
                >
                  {difficulty}
                </Badge>
              ))}
              
              {/* Clear Filters */}
              {(selectedCategory || selectedDifficulty || showFeaturedOnly || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No templates found</CardTitle>
              <CardDescription>
                {searchQuery || selectedCategory || selectedDifficulty || showFeaturedOnly
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

        <TemplateManagementModal
          isOpen={isManagementModalOpen}
          onClose={() => setIsManagementModalOpen(false)}
        />
      </div>
    </AppLayout>
  );
};

export default TemplatesPage;
