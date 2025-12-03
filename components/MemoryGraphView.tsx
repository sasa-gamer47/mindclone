import React, { useMemo, useCallback, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Memory, MemoryType } from '../types';

interface MemoryGraphViewProps {
  memories: Memory[];
  onNodeClick: (memory: Memory) => void;
}

export default function MemoryGraphView({ memories, onNodeClick }: MemoryGraphViewProps) {
  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, links } = useMemo(() => {
    if (!memories) return { nodes: [], links: [] };

    const nodes = memories.map(mem => {
        const titleContent = mem.smartSummary?.title || (mem.type === MemoryType.IMAGE ? mem.description : mem.content);
        const name = (titleContent || '').substring(0, 30) + ( (titleContent?.length || 0) > 30 ? '...' : '');
        return {
            id: mem.id,
            name: name || `Memory ${mem.id.substring(4, 8)}`,
            ...mem
        };
    });

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: { source: string, target: string }[] = [];

    memories.forEach(mem => {
      if (mem.relatedMemoryIds) {
        mem.relatedMemoryIds.forEach(relatedId => {
          // Only draw links to nodes that are currently visible in the filtered set
          if (nodeIds.has(relatedId)) {
            links.push({ source: mem.id, target: relatedId });
          }
        });
      }
    });

    return { nodes, links };
  }, [memories]);
  
  const highlightNodes = useMemo(() => {
    if (!hoveredNode) return new Set();
    const highlighted = new Set([hoveredNode]);
    links.forEach(link => {
        if (link.source === hoveredNode) highlighted.add(link.target as string);
        if (link.target === hoveredNode) highlighted.add(link.source as string);
    });
    return highlighted;
  }, [hoveredNode, links]);

  const highlightLinks = useMemo(() => {
      if (!hoveredNode) return new Set();
      return new Set(links.filter(link => link.source === hoveredNode || link.target === hoveredNode));
  }, [hoveredNode, links]);


  const handleNodeClick = useCallback((node: any) => {
    // The node object from the graph includes the full memory object via spread syntax
    const memory = memories.find(m => m.id === node.id);
    if (memory) {
        onNodeClick(memory);
    }
  }, [onNodeClick, memories]);

  const getNodeColor = (node: Memory) => {
    switch(node.type) {
      case MemoryType.TEXT: return '#0066cc';
      case MemoryType.IMAGE: return '#10b981'; // emerald-500
      case MemoryType.LINK: return '#f59e0b'; // amber-500
      default: return '#636e7b';
    }
  }
  
  const handleEngineStop = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50); // Zoom to fit with less padding
    }
  }, []);
  
  const handleNodeHover = useCallback((node: any | null) => {
    setHoveredNode(node ? node.id : null);
  }, []);

  return (
    <div className="bg-shark rounded-lg border border-gray-700 mt-4 h-[60vh] animate-fade-in overflow-hidden relative">
      {memories.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          graphData={{ nodes, links }}
          nodeLabel="name"
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          linkWidth={link => highlightLinks.has(link) ? 2 : 1}
          linkColor={() => 'rgba(100, 116, 139, 0.5)'}
          nodeCanvasObjectMode={() => 'after'}
          nodeCanvasObject={(node, ctx, globalScale) => {
            if (node.x === undefined || node.y === undefined) return;
            const label = (node as any).name;
            const fontSize = 12 / globalScale;
            
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id as string);
            
            // Node circle
            ctx.fillStyle = isHighlighted ? getNodeColor(node as Memory) : 'rgba(150, 150, 150, 0.5)';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
            ctx.fill();

            // Node label
            if (isHighlighted) {
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillText(label, node.x, node.y + 12);
            }
          }}
          onEngineStop={handleEngineStop}
          cooldownTicks={100}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-nevada">
          <p>No related memories to display in the graph.</p>
        </div>
      )}
    </div>
  );
}