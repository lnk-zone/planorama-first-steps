import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import MindmapVisualization, { MindmapStructure, ViewportState } from './MindmapVisualization';

const basicMindmap: MindmapStructure = {
  rootNode: { id: 'root', title: 'Root', position: { x: 0, y: 0 } },
  nodes: [],
  connections: [],
};

const defaultViewport: ViewportState = { x: 0, y: 0, scale: 1 };

describe('MindmapVisualization', () => {
  it('calls onViewportChange once on mount', () => {
    const onViewportChange = vi.fn();
    render(
      <MindmapVisualization mindmap={basicMindmap} onViewportChange={onViewportChange} />
    );
    expect(onViewportChange).toHaveBeenCalledTimes(1);
    expect(onViewportChange).toHaveBeenCalledWith(defaultViewport);
  });
});
