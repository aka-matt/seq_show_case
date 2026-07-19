/**
 * SequenceFlow - Main React Flow wrapper component for sequence diagrams.
 * Handles the React Flow configuration, nodes, edges, and viewport.
 */
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
  type ReactFlowInstance,
} from '@xyflow/react';
import type { LayoutResult } from '../layout/layout-types';
import { createNodes } from './createNodes';
import { createEdges } from './createEdges';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { SequenceOverlays } from '../components/SequenceOverlays';

export interface SequenceFlowProps {
  /** The computed layout result to render */
  layoutResult: LayoutResult | null;
  /** Callback when a node is clicked */
  onNodeClick?: (event: React.MouseEvent, node: { id: string }, nativeEvent?: MouseEvent) => void;
  /** Callback when an edge is clicked */
  onEdgeClick?: (event: React.MouseEvent, edge: { id: string; source: string; target: string; label?: string; messageKind?: string }, nativeEvent?: MouseEvent) => void;
  /** Callback when the viewport changes */
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  /** Callback when React Flow is ready with instance methods */
  onReady?: (instance: { fitView: (options?: object) => void; setViewport: (viewport: object) => void }) => void;
  /** Whether the diagram is in loading state */
  isLoading?: boolean;
  /** Configuration options */
  config?: {
    minZoom?: number;
    maxZoom?: number;
    controls?: boolean;
    minimap?: boolean;
    fitView?: boolean;
    interactive?: boolean;
    showBackground?: boolean;
  };
  /** Theme for colors */
  theme?: 'light' | 'dark';
  /** Palette name for colors */
  palette?: string;
}

function SequenceFlowComponent({
  layoutResult,
  onNodeClick,
  onEdgeClick,
  onViewportChange,
  onReady,
  isLoading = false,
  config = {},
  theme: _theme = 'light',
  palette: _palette = 'classic',
}: SequenceFlowProps): React.ReactElement {
  // Ref to track if onReady has been called
  const onReadyCalled = useRef(false);

  // Build dynamic config from props
  const flowConfig = useMemo(() => ({
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: config.interactive ?? true,
    edgesReconnectable: false,
    panOnDrag: config.interactive ?? true,
    zoomOnScroll: true,
    zoomOnPinch: true,
    zoomOnDoubleClick: false,
    preventScrolling: true,
    fitView: config.fitView ?? true,
    minZoom: config.minZoom ?? 0.25,
    maxZoom: config.maxZoom ?? 2,
    onlyRenderVisibleElements: true,
  }), [config]);

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

  // Handle React Flow init
  const onInit = useCallback((instance: ReactFlowInstance) => {
    if (!onReadyCalled.current && onReady) {
      onReadyCalled.current = true;
      onReady({
        fitView: (options?: object) => instance.fitView(options),
        setViewport: (viewport: object) => instance.setViewport(viewport as { x: number; y: number; zoom: number }),
      });
    }
  }, [onReady]);

  // Reset onReadyCalled when layoutResult changes
  useEffect(() => {
    onReadyCalled.current = false;
  }, [layoutResult]);

  if (isLoading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sd-canvas, #f9fafb)',
          color: 'var(--sd-text-muted, #6b7280)',
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
          background: 'var(--sd-canvas, #f9fafb)',
          color: 'var(--sd-text-muted, #6b7280)',
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
      onInit={onInit}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      {...flowConfig}
      style={{ background: config.showBackground ? 'var(--sd-canvas, #f9fafb)' : 'transparent' }}
    >
      {config.showBackground && <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--sd-border, #e5e7eb)" />}
      <SequenceOverlays layoutResult={layoutResult} />
      {config.controls && (
        <Controls
          showZoom={true}
          showFitView={true}
          position="bottom-right"
        />
      )}
      {config.minimap && (
        <MiniMap
          nodeColor="var(--sd-surface, #ffffff)"
          nodeStrokeWidth={2}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-left"
          style={{ background: 'var(--sd-surface, #ffffff)', border: '1px solid var(--sd-border, #e5e7eb)' }}
        />
      )}
    </ReactFlow>
  );
}

export const SequenceFlow = React.memo(SequenceFlowComponent);
