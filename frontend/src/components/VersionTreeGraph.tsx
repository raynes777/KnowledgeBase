import { useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../lib/api';

interface VersionTreeGraphProps {
  documentId: string;
}

interface VersionNode {
  id: string;
  versionNumber: number;
  author: string;
  createdAt: number;
  isCurrent: boolean;
  iotaTxId?: string;
  children: VersionNode[];
}

export default function VersionTreeGraph({ documentId }: VersionTreeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch version tree
  const { data: versionTree, isLoading } = useQuery({
    queryKey: ['version-tree', documentId],
    queryFn: async () => {
      const response = await documentApi.getVersionTree(documentId);
      return response.data;
    },
    enabled: !!documentId,
  });

  // Build graph nodes and edges
  useEffect(() => {
    if (!versionTree || !versionTree.trees) return;

    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    const processNode = (versionNode: VersionNode, depth: number, xOffset: number): number => {
      const nodeId = versionNode.id;

      // Create node
      graphNodes.push({
        id: nodeId,
        type: 'default',
        data: {
          label: (
            <div className="px-3 py-2">
              <div className="font-bold text-sm">
                v{versionNode.versionNumber}
                {versionNode.isCurrent && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    Current
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">By {versionNode.author}</div>
              <div className="text-xs text-gray-500">
                {new Date(versionNode.createdAt * 1000).toLocaleDateString()}
              </div>
              {versionNode.iotaTxId && (
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  IOTA
                </div>
              )}
            </div>
          ),
        },
        position: {
          x: xOffset,
          y: depth * 200,
        },
        style: {
          background: versionNode.isCurrent ? '#d1fae5' : '#f9fafb',
          border: versionNode.isCurrent ? '2px solid #10b981' : '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '0',
          width: 200,
        },
      });

      // Process children
      let currentXOffset = xOffset;
      let childrenCount = 0;

      versionNode.children.forEach((child, index) => {
        const childId = child.id;

        // Create edge from parent to child
        graphEdges.push({
          id: `${nodeId}-${childId}`,
          source: nodeId,
          target: childId,
          animated: false,
          style: { stroke: '#6b7280', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6b7280',
          },
        });

        // Process child recursively
        const childXOffset = currentXOffset + (index * 250);
        const childrenUsed = processNode(child, depth + 1, childXOffset);
        currentXOffset += childrenUsed * 250;
        childrenCount += childrenUsed;
      });

      // Return number of leaf nodes in this subtree
      return Math.max(1, childrenCount);
    };

    // Process all root trees
    let xOffset = 0;
    versionTree.trees.forEach((tree: VersionNode) => {
      const subtreeWidth = processNode(tree, 0, xOffset);
      xOffset += subtreeWidth * 250;
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [versionTree, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading version tree...</div>
      </div>
    );
  }

  if (!versionTree || !versionTree.trees || versionTree.trees.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No version history available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 border rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
