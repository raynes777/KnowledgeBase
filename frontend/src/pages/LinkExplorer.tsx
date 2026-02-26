import { useEffect, useState } from 'react';
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
import type { Document } from '../types';

interface LinkData {
  firstType: string;
  secondType: string;
  firstValue: any;
  secondValue: any;
}

export default function LinkExplorer() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('all');
  const [selectedLink, setSelectedLink] = useState<LinkData | null>(null);

  // Fetch all documents
  const { data: documents } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentApi.getAll();
      return response.data;
    },
  });

  // Fetch all links from all documents
  const { data: allLinks, isLoading } = useQuery({
    queryKey: ['all-links', selectedDocument],
    queryFn: async () => {
      if (!documents) return [];

      if (selectedDocument === 'all') {
        // Fetch links from all documents
        const linksPromises = documents.map(async (doc: Document) => {
          try {
            const response = await documentApi.getDocumentLinks(doc.id);
            return {
              documentId: doc.id,
              documentTitle: doc.title,
              links: response.data.links || [],
            };
          } catch (error) {
            return { documentId: doc.id, documentTitle: doc.title, links: [] };
          }
        });
        return await Promise.all(linksPromises);
      } else {
        // Fetch links from selected document only
        const response = await documentApi.getDocumentLinks(selectedDocument);
        const doc = documents.find((d: Document) => d.id === selectedDocument);
        return [{
          documentId: selectedDocument,
          documentTitle: doc?.title || 'Unknown',
          links: response.data.links || [],
        }];
      }
    },
    enabled: !!documents && documents.length > 0,
  });

  // Build graph nodes and edges
  useEffect(() => {
    if (!allLinks || !documents) return;

    // Collect all unique content items across all links
    const contentMap = new Map<string, { type: string; value: any; docId: string; docTitle: string }>();

    allLinks.forEach((docLinks) => {
      docLinks.links.forEach((link: LinkData) => {
        const firstKey = `${link.firstType}-${JSON.stringify(link.firstValue)}`;
        const secondKey = `${link.secondType}-${JSON.stringify(link.secondValue)}`;

        if (!contentMap.has(firstKey)) {
          contentMap.set(firstKey, {
            type: link.firstType,
            value: link.firstValue,
            docId: docLinks.documentId,
            docTitle: docLinks.documentTitle,
          });
        }

        if (!contentMap.has(secondKey)) {
          contentMap.set(secondKey, {
            type: link.secondType,
            value: link.secondValue,
            docId: docLinks.documentId,
            docTitle: docLinks.documentTitle,
          });
        }
      });
    });

    // Create nodes from unique content
    const graphNodes: Node[] = Array.from(contentMap.entries()).map(([key, content], index) => {
      const contentPreview = typeof content.value === 'string'
        ? content.value.substring(0, 50) + (content.value.length > 50 ? '...' : '')
        : JSON.stringify(content.value);

      return {
        id: key,
        type: 'default',
        data: {
          label: (
            <div className="px-3 py-2">
              <div className="text-xs font-bold text-purple-600">{content.type}</div>
              <div className="text-xs text-gray-700 mt-1">{contentPreview}</div>
              <div className="text-xs text-gray-400 mt-1">{content.docTitle}</div>
            </div>
          ),
        },
        position: {
          x: (index % 5) * 250,
          y: Math.floor(index / 5) * 180,
        },
        style: {
          background: getNodeColor(content.type),
          border: '2px solid #9333ea',
          borderRadius: '8px',
          padding: '0',
          width: 220,
        },
      };
    });

    // Create edges from links
    const graphEdges: Edge[] = [];
    let edgeIndex = 0;

    allLinks.forEach((docLinks) => {
      docLinks.links.forEach((link: LinkData) => {
        const firstKey = `${link.firstType}-${JSON.stringify(link.firstValue)}`;
        const secondKey = `${link.secondType}-${JSON.stringify(link.secondValue)}`;

        graphEdges.push({
          id: `edge-${edgeIndex++}`,
          source: firstKey,
          target: secondKey,
          animated: true,
          style: { stroke: '#9333ea', strokeWidth: 2 },
          label: 'link',
          labelStyle: { fill: '#9333ea', fontSize: 10, fontWeight: 600 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9333ea',
          },
          data: link, // Store link data for click handler
        });
      });
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [allLinks, documents, setNodes, setEdges]);

  const getNodeColor = (contentType: string): string => {
    switch (contentType) {
      case 'StringContent':
        return '#ede9fe'; // purple-100
      case 'IntegerContent':
        return '#dbeafe'; // blue-100
      case 'TranscludedContent':
        return '#fef3c7'; // amber-100
      case 'ImageContent':
        return '#ccfbf1'; // teal-100
      default:
        return '#f3f4f6'; // gray-100
    }
  };

  const onEdgeClick = (_event: React.MouseEvent, edge: Edge) => {
    if (edge.data) {
      setSelectedLink(edge.data as LinkData);
    }
  };

  if (!documents || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading links...</div>
      </div>
    );
  }

  const totalLinks = allLinks?.reduce((sum, doc) => sum + doc.links.length, 0) || 0;

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
              <h1 className="text-xl font-bold text-gray-900">Link Explorer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {totalLinks} bidirectional link{totalLinks !== 1 ? 's' : ''}
              </div>
              <select
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Documents</option>
                {documents.map((doc: Document) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Graph */}
      <div className="h-[calc(100vh-4rem)]">
        {totalLinks > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                return node.style?.background as string || '#f3f4f6';
              }}
            />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No links found</p>
              <p className="text-gray-400 text-sm">
                Links are created when Content objects are connected using <code>content.link()</code>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Link Details Modal */}
      {selectedLink && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Bidirectional Link Details</h3>
              <button
                onClick={() => setSelectedLink(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-900 mb-2">First Content</p>
                <p className="text-sm font-medium text-purple-700">{selectedLink.firstType}</p>
                <pre className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                  {typeof selectedLink.firstValue === 'string'
                    ? selectedLink.firstValue
                    : JSON.stringify(selectedLink.firstValue, null, 2)}
                </pre>
              </div>

              <div className="flex justify-center">
                <div className="text-purple-600 font-bold text-2xl">↔</div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-purple-900 mb-2">Second Content</p>
                <p className="text-sm font-medium text-purple-700">{selectedLink.secondType}</p>
                <pre className="text-xs text-gray-700 mt-2 whitespace-pre-wrap">
                  {typeof selectedLink.secondValue === 'string'
                    ? selectedLink.secondValue
                    : JSON.stringify(selectedLink.secondValue, null, 2)}
                </pre>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-900">
                  <strong>Xanadu Concept:</strong> This is a bidirectional Link&lt;T,R&gt; where both
                  Content objects reference each other via <code>addLink()</code>. Changes to either
                  Content do not affect the link relationship.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedLink(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
        <h3 className="font-bold text-sm mb-2">Content Types</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 border-2 border-purple-600 rounded"></div>
            <span>StringContent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-purple-600 rounded"></div>
            <span>IntegerContent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 border-2 border-purple-600 rounded"></div>
            <span>TranscludedContent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-teal-100 border-2 border-purple-600 rounded"></div>
            <span>ImageContent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-600"></div>
            <span>Bidirectional Link</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">Click any edge to view link details</p>
      </div>
    </div>
  );
}
