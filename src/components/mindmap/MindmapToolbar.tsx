
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  Share2, 
  FileText, 
  Layout, 
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MindmapToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onExport: () => void;
  onShare: () => void;
  onGeneratePRD: () => void;
  onAutoLayout: () => void;
  nodeCount: number;
  connectionCount: number;
}

export const MindmapToolbar: React.FC<MindmapToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onExport,
  onShare,
  onGeneratePRD,
  onAutoLayout,
  nodeCount,
  connectionCount,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      {/* Left side - Main actions */}
      <div className="flex items-center space-x-3">
        <Button onClick={onGeneratePRD} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          Generate PRD
        </Button>
        
        <Button onClick={onAutoLayout} variant="outline">
          <Layout className="h-4 w-4 mr-2" />
          Auto Layout
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button onClick={onShare} variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        <Button onClick={onExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Center - Stats */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Badge variant="outline">{nodeCount} nodes</Badge>
          <Badge variant="outline">{connectionCount} connections</Badge>
        </div>
      </div>

      {/* Right side - View controls */}
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" disabled>
          <Search className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="sm" disabled>
          <Filter className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button onClick={onZoomOut} variant="ghost" size="sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <Button onClick={onZoomIn} variant="ghost" size="sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button onClick={onFitView} variant="ghost" size="sm">
          <Maximize2 className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>
              View Options
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              Themes
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
