import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../lib/api';

interface NodeStructure {
  content: {
    type: string;
    value: any;
    authorName?: string;
  };
  children: NodeStructure[];
  childrenCount: number;
  maxDepthReached?: boolean;
}

interface Props {
  documentId: string;
  versionId: string;
}

export default function NodeTreeViewer({ documentId, versionId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['node-structure', documentId, versionId],
    queryFn: async () => {
      const response = await documentApi.getNodeStructure(documentId, versionId);
      return response.data as NodeStructure;
    }
  });

  const renderNode = (node: NodeStructure, depth: number = 0) => (
    <div key={depth} style={{ marginLeft: `${depth * 20}px` }} className="border-l-2 border-purple-300 pl-3 my-2">
      <div className="text-sm bg-purple-50 p-2 rounded">
        <div className="flex items-center gap-2">
          <span className="font-mono text-purple-700 font-bold">{node.content.type}</span>
          {node.content.authorName && (
            <span className="text-xs text-gray-600">by {node.content.authorName}</span>
          )}
          {node.childrenCount > 0 && (
            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
              {node.childrenCount} child{node.childrenCount > 1 ? 'ren' : ''}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-700 mt-1 truncate max-w-md">
          {String(node.content.value).substring(0, 80)}
          {String(node.content.value).length > 80 && '...'}
        </div>
      </div>

      {node.maxDepthReached && (
        <div className="text-red-500 text-xs ml-4 mt-1">⚠️ Max depth reached</div>
      )}

      {node.children && node.children.length > 0 && (
        <div className="mt-1">
          {node.children.map((child, i) => (
            <div key={i}>{renderNode(child, depth + 1)}</div>
          ))}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200">
        <p className="text-red-600 text-sm">Error loading node structure: {String(error)}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 p-4 rounded border">
        <p className="text-gray-500 text-sm">No structure data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Document Node Structure</h3>
        <span className="text-xs text-gray-500">Xanadu Core Visualization</span>
      </div>
      <div className="overflow-x-auto">
        {renderNode(data)}
      </div>
      <div className="mt-4 text-xs text-gray-500 border-t pt-2">
        <p>💡 This view shows the internal Xanadu Node hierarchy with Content types</p>
      </div>
    </div>
  );
}
