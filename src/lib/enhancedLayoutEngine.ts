
import { LayoutNode, LayoutLink } from './layoutEngine';

export interface EnhancedLayoutOptions {
  width?: number;
  height?: number;
  nodeSpacing?: number;
  levelSpacing?: number;
  centerX?: number;
  centerY?: number;
}

export class ProfessionalLayoutEngine {
  static hierarchicalLayout(
    nodes: LayoutNode[],
    links: LayoutLink[],
    options: EnhancedLayoutOptions = {}
  ): LayoutNode[] {
    const {
      width = 1200,
      height = 800,
      nodeSpacing = 300,
      levelSpacing = 200,
      centerX = width / 2,
      centerY = height / 2
    } = options;

    // Build hierarchy
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
    const children = new Map<string, LayoutNode[]>();
    const levels = new Map<string, number>();
    
    // Find relationships
    links.forEach(link => {
      const child = nodeMap.get(link.target);
      if (child) {
        child.parentId = link.source;
        if (!children.has(link.source)) {
          children.set(link.source, []);
        }
        children.get(link.source)!.push(child);
      }
    });

    // Find root nodes
    const roots = Array.from(nodeMap.values()).filter(n => !n.parentId);
    
    // Calculate levels
    const calculateLevels = (node: LayoutNode, level: number = 0) => {
      levels.set(node.id, level);
      const nodeChildren = children.get(node.id) || [];
      nodeChildren.forEach(child => calculateLevels(child, level + 1));
    };

    roots.forEach(root => calculateLevels(root));

    // Group nodes by level
    const levelGroups = new Map<number, LayoutNode[]>();
    Array.from(nodeMap.values()).forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Position nodes level by level
    const maxLevel = Math.max(...levels.values());
    
    for (let level = 0; level <= maxLevel; level++) {
      const levelNodes = levelGroups.get(level) || [];
      const levelY = centerY + (level - maxLevel / 2) * levelSpacing;
      
      if (level === 0) {
        // Center root nodes
        levelNodes.forEach((node, index) => {
          node.x = centerX + (index - (levelNodes.length - 1) / 2) * nodeSpacing;
          node.y = levelY;
        });
      } else {
        // Position child nodes relative to their parents
        levelNodes.forEach(node => {
          const parent = nodeMap.get(node.parentId!);
          if (parent) {
            const siblings = children.get(node.parentId!) || [];
            const siblingIndex = siblings.findIndex(s => s.id === node.id);
            const siblingCount = siblings.length;
            
            // Distribute siblings around parent
            const offsetX = (siblingIndex - (siblingCount - 1) / 2) * (nodeSpacing * 0.8);
            node.x = parent.x + offsetX;
            node.y = levelY;
          }
        });
      }
    }

    return Array.from(nodeMap.values());
  }

  static radialLayout(
    nodes: LayoutNode[],
    links: LayoutLink[],
    options: EnhancedLayoutOptions = {}
  ): LayoutNode[] {
    const {
      width = 1200,
      height = 800,
      nodeSpacing = 150,
      centerX = width / 2,
      centerY = height / 2
    } = options;

    // Build hierarchy
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
    const children = new Map<string, LayoutNode[]>();
    
    links.forEach(link => {
      const child = nodeMap.get(link.target);
      if (child) {
        child.parentId = link.source;
        if (!children.has(link.source)) {
          children.set(link.source, []);
        }
        children.get(link.source)!.push(child);
      }
    });

    const roots = Array.from(nodeMap.values()).filter(n => !n.parentId);
    
    const positionRadially = (node: LayoutNode, radius: number, angle: number, level: number = 0) => {
      if (level === 0) {
        node.x = centerX;
        node.y = centerY;
      } else {
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      }

      const nodeChildren = children.get(node.id) || [];
      if (nodeChildren.length > 0) {
        const childRadius = radius + nodeSpacing;
        const angleStep = (Math.PI * 2) / Math.max(nodeChildren.length, 3);
        
        nodeChildren.forEach((child, index) => {
          const childAngle = angle + (index - (nodeChildren.length - 1) / 2) * angleStep;
          positionRadially(child, childRadius, childAngle, level + 1);
        });
      }
    };

    roots.forEach(root => positionRadially(root, 0, 0));
    
    return Array.from(nodeMap.values());
  }
}
