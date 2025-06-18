
import { useState, useEffect } from 'react';
import { PRDGenerator, type PRDDocument } from '@/lib/prdGenerator';
import { toast } from 'sonner';

export const usePRD = (projectId: string) => {
  const [prd, setPrd] = useState<PRDDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const prdGenerator = new PRDGenerator();

  const loadExistingPRD = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    try {
      const existingPRD = await prdGenerator.getPRDByProjectId(projectId);
      setPrd(existingPRD);
    } catch (error) {
      console.error('Error loading PRD:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePRD = async (template: 'comprehensive' | 'technical' | 'business' | 'ai_builder' = 'ai_builder') => {
    setIsGenerating(true);
    try {
      const newPRD = await prdGenerator.generateComprehensivePRD(projectId, template);
      setPrd(newPRD);
      
      // Enhanced success message with phase information
      const phaseCount = newPRD.implementationPhases?.length || 0;
      const message = phaseCount > 0 
        ? `PRD generated successfully with ${phaseCount} implementation phases!`
        : 'PRD generated successfully!';
      
      toast.success(message);
      return newPRD;
    } catch (error) {
      console.error('Error generating PRD:', error);
      toast.error('Failed to generate PRD. Please try again.');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPRD = async (format: 'markdown' | 'html' | 'text' | 'pdf') => {
    if (!prd) return;
    
    setIsExporting(true);
    try {
      const exportResult = await prdGenerator.exportPRD(prd.id, format);
      
      // Create download
      const blob = exportResult.data instanceof Blob 
        ? exportResult.data 
        : new Blob([exportResult.data], { type: exportResult.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportResult.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`PRD exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting PRD:', error);
      toast.error('Failed to export PRD. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadExistingPRD();
  }, [projectId]);

  return {
    prd,
    isLoading,
    isGenerating,
    isExporting,
    generatePRD,
    exportPRD,
    refetch: loadExistingPRD
  };
};
