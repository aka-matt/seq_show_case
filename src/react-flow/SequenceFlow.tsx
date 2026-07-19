/**
 * SequenceFlow - Main React Flow wrapper component for sequence diagrams.
 * Handles the React Flow configuration, nodes, edges, and viewport.
 */
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
} from '@xyflow/react';
import type { LayoutResult } from '../layout/layout-types';
import { createNodes } from './createNodes';
import { createEdges } from './createEdges';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';

// React Flow configuration per spec section 5.1
const FLOW_CONFIG = {
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true,
  edgesReconnectable: false,
  panOnDrag: true,
  zoomOnScroll: true,
  zoomOnPinch: true,
  zoomOnDoubleClick: false,
  preventScrolling: true,
  fitView: true,
  minZoom: 0.25,
  maxZoom: 2,
  onlyRenderVisibleElements: true,
} as const;

export interface SequenceFlowProps {
  /** The computed layout result to render */
  layoutResult: LayoutResult | null;
  /** Callback when a node is clicked */
  onNodeClick?: (event: React.MouseEvent, node: { id: string }) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (event: React.MouseEvent, edge: { id: string }) => void;
  /** Callback when the viewport changes */
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  /** Whether the diagram is in loading state */
  isLoading?: boolean;
}

function SequenceFlowComponent({
  layoutResult,
  onNodeClick,
  onEdgeClick,
  onViewportChange,
  isLoading = false,
}: SequenceFlowProps): React.ReactElement {
  // Convert layout result to nodes and edges
  const initialNodes = useMemo(() => {
    if (!layoutResult) return [];
    return createNodes(layoutResult);
  }, [layoutResult]);

  const initialEdges = useMemo(() => {
    if (!layoutResult) return [];
    return createEdges(layoutResult);
  }, [layoutResult]);

  // Use React Flow's state management
  // Cast to any to bypass strict type checking for custom node/edge data types
  const [nodes, setNodes] = useNodesState(initialNodes as any);
  const [edges, setEdges] = useEdgesState(initialEdges as any);

  // Update nodes and edges when layout changes
  useEffect(() => {
    setNodes(initialNodes as any);
    setEdges(initialEdges as any);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node changes (selection, etc.)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as typeof nds);
    },
    [setNodes]
  );

  // Handle edge changes (selection, etc.)
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds) as typeof eds);
    },
    [setEdges]
  );

  // Handle viewport changes
  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      onViewportChange?.(viewport);
    },
    [onViewportChange]
  );

  // Handle connection (for future use - connectable edges)
  const onConnect = useCallback((_connection: Connection) => {
    // Connections disabled in read-only mode
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          color: '#6b7280',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!layoutResult) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          color: '#6b7280',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
        }}
      >
        No data to display
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick as any}
      onEdgeClick={onEdgeClick as any}
      onMoveEnd={onMoveEnd as any}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      {...FLOW_CONFIG}
      style={{ background: '#f9fafb' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
      <Controls
        showZoom={true}
        showFitView={true}
        position="bottom-right"
      />
      <MiniMap
        nodeColor="#ffffff"
        nodeStrokeWidth={2}
        maskColor="rgba(0, 0, 0, 0.1)"
        position="bottom-left"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}
      />
    </ReactFlow>
  );
}

export const SequenceFlow = React.memo(SequenceFlowComponent);
