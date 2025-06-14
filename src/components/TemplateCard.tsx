
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectTemplate, TemplateFeature } from '@/hooks/useTemplates';
import { Layers, CheckCircle } from 'lucide-react';

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: (template: ProjectTemplate) => void;
}

const TemplateCard = ({ template, onSelect }: TemplateCardProps) => {
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

  const getCategoryColor = (category: string) => {
    const colors = {
      'web_app': 'bg-blue-100 text-blue-800',
      'mobile_app': 'bg-purple-100 text-purple-800',
      'ecommerce': 'bg-green-100 text-green-800',
      'cms': 'bg-orange-100 text-orange-800',
      'saas': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Safely parse features from JSON
  const features = Array.isArray(template.features) ? template.features as TemplateFeature[] : [];

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getCategoryColor(template.category)}>
                {getCategoryLabel(template.category)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Layers className="w-3 h-3 mr-1" />
                {features.length} features
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <CardDescription className="text-sm text-gray-600 mb-4 flex-1">
          {template.description}
        </CardDescription>
        
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-700">Included Features:</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 mr-2 text-green-500 flex-shrink-0" />
                <span className="truncate">{feature.title}</span>
              </div>
            ))}
            {features.length > 4 && (
              <p className="text-xs text-gray-500 italic">
                +{features.length - 4} more features
              </p>
            )}
          </div>
        </div>
        
        <Button 
          onClick={() => onSelect(template)} 
          className="w-full group-hover:bg-primary/90 transition-colors"
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
