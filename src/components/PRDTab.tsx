
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Zap, Download, Eye, Clock, Users, Target, Wrench, RefreshCw } from 'lucide-react';
import { usePRD } from '@/hooks/usePRD';
import { useParams } from 'react-router-dom';

interface PRDTabProps {
  projectTitle: string;
  projectDescription?: string;
}

const PRDTab: React.FC<PRDTabProps> = ({ projectTitle, projectDescription }) => {
  const { id: projectId } = useParams<{ id: string }>();
  const { prd, isLoading, isGenerating, isExporting, generatePRD, exportPRD } = usePRD(projectId || '');
  const [selectedTemplate, setSelectedTemplate] = useState<'comprehensive' | 'technical' | 'business' | 'ai_builder'>('ai_builder');

  const handleGeneratePRD = async () => {
    try {
      await generatePRD(selectedTemplate);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleExport = async (format: 'markdown' | 'html' | 'text' | 'pdf') => {
    try {
      await exportPRD(format);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!prd) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Requirements Document</h2>
          <p className="text-gray-600">
            Generate a comprehensive PRD with detailed specifications, execution phases, and implementation guidance
          </p>
        </div>

        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Choose PRD Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Template Type</label>
              <Select value={selectedTemplate} onValueChange={(value: any) => setSelectedTemplate(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_builder">AI Builder Optimized (Recommended)</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Business</SelectItem>
                  <SelectItem value="technical">Technical Focused</SelectItem>
                  <SelectItem value="business">Business Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">AI Builder Optimized Includes:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Lovable, Bolt & Cursor specific guidance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Copy-paste ready specifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Incremental development approach</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Common pitfalls and solutions</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">All Templates Include:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Executive summary & project overview</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Feature specifications with execution order</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Implementation roadmap & milestones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Success metrics & testing criteria</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Action Card */}
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">Ready to Generate PRD</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Generate a professional Product Requirements Document with detailed specifications, 
              user stories organized by execution order, and implementation guidance.
            </p>
            <Button
              onClick={handleGeneratePRD}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating PRD...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Comprehensive PRD
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Requirements Document</h2>
          <p className="text-gray-600">
            Generated on {prd.generatedAt.toLocaleDateString()} • {prd.wordCount.toLocaleString()} words
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('markdown')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('html')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            HTML
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            onClick={handleGeneratePRD}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate PRD
              </>
            )}
          </Button>
        </div>
      </div>

      {/* PRD Content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="sections">Edit Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {prd.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="space-y-4">
            {prd.sections.map((section, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    <Badge variant="outline">Section {section.order}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
                      {section.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PRDTab;
