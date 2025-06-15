export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  parentId?: string | null;
}

export interface LayoutLink {
  source: string;
  target: string;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  verticalSpacing?: number;
  horizontalSpacing?: number;
  radiusStep?: number;
  iterations?: number;
  animate?: boolean;
  duration?: number;
}

export interface LayoutEngine {
  layout(
    nodes: LayoutNode[],
    links: LayoutLink[],
    options?: Partial<LayoutOptions>
  ): LayoutNode[];
}

function buildHierarchy(nodes: LayoutNode[], links: LayoutLink[]): Map<string, LayoutNode[]> {
  const children = new Map<string, LayoutNode[]>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  links.forEach(l => {
    const child = nodeMap.get(l.target);
    if (!child) return;
    child.parentId = l.source;
    if (!children.has(l.source)) children.set(l.source, []);
    children.get(l.source)!.push(child);
  });

  nodes.forEach(n => {
    if (n.parentId) {
      if (!children.has(n.parentId)) children.set(n.parentId, []);
      children.get(n.parentId)!.push(n);
    }
  });

  return children;
}

export const TreeLayout: LayoutEngine = {
  layout(nodes, links, options = {}) {
    const { horizontalSpacing = 200, verticalSpacing = 100 } = options;
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
    const children = buildHierarchy(Array.from(nodeMap.values()), links);
    const roots = Array.from(nodeMap.values()).filter(n => !n.parentId);

    let index = 0;
    const positioned: LayoutNode[] = [];

    const dfs = (node: LayoutNode, depth: number) => {
      const childNodes = children.get(node.id) || [];
      childNodes.forEach(c => dfs(c, depth + 1));
      if (childNodes.length === 0) {
        node.x = depth * horizontalSpacing;
        node.y = index++ * verticalSpacing;
      } else {
        const ys = childNodes.map(c => c.y);
        node.x = depth * horizontalSpacing;
        node.y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
      positioned.push(node);
    };

    roots.forEach(r => dfs(r, 0));
    return positioned;
  }
};

export const RadialLayout: LayoutEngine = {
  layout(nodes, links, options = {}) {
    const { radiusStep = 150, width = 800, height = 600 } = options;
    const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
    const children = buildHierarchy(Array.from(nodeMap.values()), links);
    const roots = Array.from(nodeMap.values()).filter(n => !n.parentId);
    const levels: LayoutNode[][] = [];

    const bfs = (root: LayoutNode) => {
      const queue: Array<{ node: LayoutNode; depth: number }> = [
        { node: root, depth: 0 }
      ];
      while (queue.length) {
        const { node, depth } = queue.shift()!;
        if (!levels[depth]) levels[depth] = [];
        levels[depth].push(node);
        (children.get(node.id) || []).forEach(c =>
          queue.push({ node: c, depth: depth + 1 })
        );
      }
    };

    roots.forEach(r => bfs(r));

    const centerX = width / 2;
    const centerY = height / 2;

    levels.forEach((levelNodes, depth) => {
      const radius = depth * radiusStep;
      const step = (2 * Math.PI) / Math.max(1, levelNodes.length);
      levelNodes.forEach((node, i) => {
        const angle = i * step;
        node.x = centerX + Math.cos(angle) * radius;
        node.y = centerY + Math.sin(angle) * radius;
      });
    });

    return Array.from(nodeMap.values());
  }
};

export const ForceDirectedLayout: LayoutEngine = {
  layout(nodes, links, options = {}) {
    const { width = 800, height = 600, iterations = 200 } = options;
    interface ForceNode extends LayoutNode { vx: number; vy: number }
    const nodeMap = new Map<string, ForceNode>(
      nodes.map(n => [n.id, { ...n, x: n.x || Math.random() * width, y: n.y || Math.random() * height, vx: 0, vy: 0 }])
    );
    const k = Math.sqrt((width * height) / nodeMap.size);
    const repulsion = k * k;

    for (let i = 0; i < iterations; i++) {
      nodeMap.forEach(n => {
        n.vx = 0;
        n.vy = 0;
      });

      const arr = Array.from(nodeMap.values());
      for (let a = 0; a < arr.length; a++) {
        for (let b = a + 1; b < arr.length; b++) {
          const n1 = arr[a];
          const n2 = arr[b];
          let dx = n1.x - n2.x;
          let dy = n1.y - n2.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 === 0) {
            dist2 = 0.01;
            dx = Math.random() * 0.1;
            dy = Math.random() * 0.1;
          }
          const force = repulsion / dist2;
          const fx = dx * force;
          const fy = dy * force;
          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        }
      }

      links.forEach(l => {
        const s = nodeMap.get(l.source);
        const t = nodeMap.get(l.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - k) * 0.1;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      });

      nodeMap.forEach(n => {
        n.x += Math.max(-5, Math.min(5, n.vx));
        n.y += Math.max(-5, Math.min(5, n.vy));
        n.x = Math.min(width, Math.max(0, n.x));
        n.y = Math.min(height, Math.max(0, n.y));
      });
    }

    return Array.from(nodeMap.values()).map(n => ({ id: n.id, x: n.x, y: n.y, parentId: n.parentId }));
  }
};

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function updateNodePositions(
  nodes: LayoutNode[],
  newPositions: Record<string, { x: number; y: number }>,
  options: Pick<LayoutOptions, 'animate' | 'duration'> = {}
) {
  const { animate = true, duration = 500 } = options;
  if (!animate) {
    nodes.forEach(n => {
      const p = newPositions[n.id];
      if (p) {
        n.x = p.x;
        n.y = p.y;
      }
    });
    return;
  }

  const start = performance.now();
  const startPos: Record<string, { x: number; y: number }> = {};
  nodes.forEach(n => {
    startPos[n.id] = { x: n.x, y: n.y };
  });

  function step(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const e = ease(t);
    nodes.forEach(n => {
      const s = startPos[n.id];
      const p = newPositions[n.id];
      if (s && p) {
        n.x = s.x + (p.x - s.x) * e;
        n.y = s.y + (p.y - s.y) * e;
      }
    });
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

export type LayoutType = 'tree' | 'radial' | 'force';

export function autoArrange(
  layout: LayoutType,
  nodes: LayoutNode[],
  links: LayoutLink[],
  options: LayoutOptions = {}
) {
  let result: LayoutNode[];
  if (layout === 'radial') {
    result = RadialLayout.layout(nodes, links, options);
  } else if (layout === 'force') {
    result = ForceDirectedLayout.layout(nodes, links, options);
  } else {
    result = TreeLayout.layout(nodes, links, options);
  }

  const pos = result.reduce<Record<string, { x: number; y: number }>>((acc, n) => {
    acc[n.id] = { x: n.x, y: n.y };
    return acc;
  }, {});

  updateNodePositions(nodes, pos, { animate: options.animate, duration: options.duration });
}
