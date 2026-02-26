import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { documentApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function TransclusionGraph() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch all documents
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentApi.getAll();
      return response.data;
    },
  });

  // Fetch all transclusions
  const { data: allTransclusions } = useQuery({
    queryKey: ['all-transclusions'],
    queryFn: async () => {
      if (!documents) return [];
      const transclusions = await Promise.all(
        documents.map(async (doc) => {
          const [incoming, outgoing] = await Promise.all([
            documentApi.getIncomingTransclusions(doc.id),
            documentApi.getOutgoingTransclusions(doc.id),
          ]);
          return {
            docId: doc.id,
            incoming: incoming.data,
            outgoing: outgoing.data,
          };
        })
      );
      return transclusions;
    },
    enabled: !!documents && documents.length > 0,
  });

  // Build graph
  useEffect(() => {
    if (!documents || !allTransclusions) return;

    // Create nodes
    const graphNodes: Node[] = documents.map((doc, index) => {
      const transclusionCount =
        (allTransclusions.find(t => t.docId === doc.id)?.incoming.length || 0) +
        (allTransclusions.find(t => t.docId === doc.id)?.outgoing.length || 0);

      return {
        id: doc.id,
        type: 'default',
        data: {
          label: (
            <div className="px-3 py-2">
              <div className="font-bold text-sm">{doc.title}</div>
              <div className="text-xs text-gray-500">v{doc.currentVersionNumber}</div>
              {transclusionCount > 0 && (
                <div className="text-xs text-purple-600 mt-1">
                  {transclusionCount} transclusion{transclusionCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )
        },
        position: {
          x: (index % 4) * 300,
          y: Math.floor(index / 4) * 200,
        },
        style: {
          background: transclusionCount > 0 ? '#faf5ff' : '#f9fafb',
          border: transclusionCount > 0 ? '2px solid #9333ea' : '1px solid #d1d5db',
          borderRadius: '8px',
          padding: '0',
          width: 250,
        },
      };
    });

    // Create edges
    const graphEdges: Edge[] = [];
    allTransclusions.forEach(({ outgoing }) => {
      outgoing.forEach((t) => {
        if (t.sourceDocument?.id && t.targetDocument?.id) {
          graphEdges.push({
            id: t.id,
            source: t.sourceDocument.id,
            target: t.targetDocument.id,
            animated: true,
            style: { stroke: '#9333ea', strokeWidth: 2 },
            label: 'transclude',
            labelStyle: { fill: '#9333ea', fontSize: 10 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#9333ea',
            },
          });
        }
      });
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [documents, allTransclusions, setNodes, setEdges]);

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    navigate(`/documents/${node.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Transclusion Graph</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Graph */}
      <div className="h-[calc(100vh-4rem)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const hasTransclusions = edges.some(
                e => e.source === node.id || e.target === node.id
              );
              return hasTransclusions ? '#9333ea' : '#6b7280';
            }}
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="font-bold text-sm mb-2">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-600 rounded"></div>
            <span>Document with transclusions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Document without transclusions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-600"></div>
            <span>Transclusion relationship</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Click any node to view document</p>
      </div>
    </div>
  );
}
