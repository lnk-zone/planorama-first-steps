
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Zap, Code, MessageSquare, Check } from 'lucide-react';

interface PromptsTabProps {
  projectTitle: string;
  projectDescription?: string;
  features: any[];
}

const PromptsTab: React.FC<PromptsTabProps> = ({ 
  projectTitle, 
  projectDescription, 
  features 
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const generateLovablePrompt = () => {
    return `Create a ${projectTitle} application with the following features:

Project Description: ${projectDescription || 'A modern web application'}

Key Features:
${features.slice(0, 5).map((feature, index) => 
  `${index + 1}. ${feature.title}${feature.description ? ` - ${feature.description}` : ''}`
).join('\n')}

Please implement this using React, TypeScript, and Tailwind CSS with a modern, responsive design.`;
  };

  const generateChatGPTPrompt = () => {
    return `I need help building a web application called "${projectTitle}".

Description: ${projectDescription || 'A modern web application'}

Core Features to Implement:
${features.slice(0, 6).map((feature, index) => 
  `• ${feature.title}${feature.description ? ` - ${feature.description}` : ''}`
).join('\n')}

Can you help me create a development plan and provide code examples for implementing these features?`;
  };

  const generateClaudePrompt = () => {
    return `Help me develop "${projectTitle}" - ${projectDescription || 'a web application'}.

I need to implement these features:
${features.slice(0, 6).map((feature, index) => 
  `${index + 1}. ${feature.title}${feature.description ? `\n   Description: ${feature.description}` : ''}`
).join('\n\n')}

Please provide:
- Technical architecture recommendations
- Step-by-step implementation guide
- Code examples where helpful
- Best practices for each feature`;
  };

  const prompts = [
    {
      title: 'Lovable Prompt',
      description: 'Optimized for Lovable AI builder',
      icon: Code,
      color: 'from-purple-600 to-blue-600',
      generate: generateLovablePrompt
    },
    {
      title: 'ChatGPT Prompt',
      description: 'General development assistance',
      icon: MessageSquare,
      color: 'from-green-600 to-teal-600',
      generate: generateChatGPTPrompt
    },
    {
      title: 'Claude Prompt',
      description: 'Detailed technical guidance',
      icon: Zap,
      color: 'from-orange-600 to-red-600',
      generate: generateClaudePrompt
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Builder Prompts</h2>
        <p className="text-gray-600">
          Generate optimized prompts for different AI development tools
        </p>
      </div>

      {/* Prompts Grid */}
      <div className="grid gap-6">
        {prompts.map((prompt, index) => {
          const Icon = prompt.icon;
          const generatedPrompt = prompt.generate();
          
          return (
            <Card key={index} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${prompt.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{prompt.title}</CardTitle>
                      <p className="text-sm text-gray-600">{prompt.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {generatedPrompt.length} chars
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={generatedPrompt}
                    readOnly
                    className="min-h-[200px] text-sm font-mono resize-none"
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Ready to copy and paste into {prompt.title.split(' ')[0]}
                    </div>
                    <Button
                      onClick={() => handleCopyToClipboard(generatedPrompt, index)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Pro Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Customize the prompts based on your specific needs</li>
            <li>• Add more context about your target users and technical requirements</li>
            <li>• Break down complex features into smaller, manageable prompts</li>
            <li>• Include any specific design preferences or constraints</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptsTab;
