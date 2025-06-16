
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Zap, Download, Eye } from 'lucide-react';

interface PRDTabProps {
  projectTitle: string;
  projectDescription?: string;
}

const PRDTab: React.FC<PRDTabProps> = ({ projectTitle, projectDescription }) => {
  const handleGeneratePRD = () => {
    // Placeholder for AI PRD generation
    console.log('Generate PRD with AI');
  };

  const handleDownloadPRD = () => {
    // Placeholder for PRD download
    console.log('Download PRD');
  };

  const handlePreviewPRD = () => {
    // Placeholder for PRD preview
    console.log('Preview PRD');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Requirements Document</h2>
        <p className="text-gray-600">
          Generate a comprehensive PRD for your project using AI
        </p>
      </div>

      {/* Main Action Card */}
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl">No PRD Generated Yet</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Generate a professional Product Requirements Document that includes objectives, 
            user personas, functional requirements, and technical specifications.
          </p>
          <Button
            onClick={handleGeneratePRD}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Generate PRD with AI
          </Button>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              What's Included
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Executive Summary & Project Overview</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>User Personas & Journey Maps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Functional & Non-functional Requirements</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Technical Architecture & Stack</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Implementation Timeline & Milestones</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Success Metrics & KPIs</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Preview Sample
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">1. Executive Summary</h4>
              <p className="text-gray-600 mb-3">
                {projectTitle} aims to {projectDescription || 'solve key user problems through innovative technology'}...
              </p>
              
              <h4 className="font-semibold mb-2">2. Target Users</h4>
              <p className="text-gray-600 mb-3">
                Primary: [User personas will be generated based on your project]
              </p>
              
              <h4 className="font-semibold mb-2">3. Core Features</h4>
              <p className="text-gray-600">
                [Detailed feature breakdown from your feature list]
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handlePreviewPRD} disabled>
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button variant="outline" onClick={handleDownloadPRD} disabled>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default PRDTab;
