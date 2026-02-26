import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { documentApi, verificationApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { UpdateDocumentRequest, TranscludeRequest } from '../types';
import NodeTreeViewer from '../components/NodeTreeViewer';
import VersionTreeGraph from '../components/VersionTreeGraph';

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    changeDescription: ''
  });

  const [showTranscludeModal, setShowTranscludeModal] = useState(false);
  const [transcludeForm, setTranscludeForm] = useState({
    sourceDocumentId: '',
    sourceNodePath: '',
    targetNodePath: ''
  });
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  const [comparisonData, setComparisonData] = useState<{
    oldVersion: any;
    newVersion: any;
  } | null>(null);

  const [showNodeStructure, setShowNodeStructure] = useState(false);

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [addSectionForm, setAddSectionForm] = useState<{
    contentType: 'STRING' | 'INTEGER' | 'IMAGE';
    value: string | number;
  }>({
    contentType: 'STRING',
    value: '',
  });

  const [showVersionTreeModal, setShowVersionTreeModal] = useState(false);

  const extractContent = (contentJson: Record<string, any>): string => {
    if (contentJson?.content?.value) {
      return contentJson.content.value;
    }
    return JSON.stringify(contentJson, null, 2);
  };

  const renderContentTypeAware = (contentJson: Record<string, any>) => {
    if (!contentJson?.content) {
      return <pre className="whitespace-pre-wrap text-gray-700">{JSON.stringify(contentJson, null, 2)}</pre>;
    }

    const contentType = contentJson.content.type;
    const value = contentJson.content.value;

    switch (contentType) {
      case 'StringContent':
        return (
          <div>
            <div className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded mb-2">
              StringContent
            </div>
            <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded border">
              {value}
            </pre>
          </div>
        );

      case 'IntegerContent':
        return (
          <div>
            <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-2">
              IntegerContent
            </div>
            <div className="text-4xl font-bold text-blue-600 bg-blue-50 p-6 rounded border border-blue-200 inline-block">
              {value}
            </div>
          </div>
        );

      case 'ImageContent':
        return (
          <div>
            <div className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded mb-2">
              ImageContent
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded p-4">
              <img
                src={value}
                alt="Document image"
                className="max-w-full h-auto rounded shadow-sm"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  img.parentElement?.insertAdjacentHTML('beforeend',
                    '<p class="text-red-500 text-sm">Failed to load image: ' + value + '</p>');
                }}
              />
              <p className="text-xs text-gray-500 mt-2 break-all">{value}</p>
            </div>
          </div>
        );

      case 'TranscludedContent':
        return (
          <div>
            <div className="inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded mb-2">
              TranscludedContent (Embedded Node)
            </div>
            <div className="bg-amber-50 border-2 border-amber-300 rounded p-4">
              <p className="text-xs text-amber-900 font-semibold mb-2">Referenced Content:</p>
              <pre className="whitespace-pre-wrap text-gray-700 text-sm">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <div className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded mb-2">
              {contentType || 'Unknown Type'}
            </div>
            <pre className="whitespace-pre-wrap text-gray-700">
              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await documentApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['document-versions', id],
    queryFn: async () => {
      const response = await documentApi.getVersions(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: incomingTransclusions } = useQuery({
    queryKey: ['transclusions-incoming', id],
    queryFn: async () => {
      const response = await documentApi.getIncomingTransclusions(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: outgoingTransclusions } = useQuery({
    queryKey: ['transclusions-outgoing', id],
    queryFn: async () => {
      const response = await documentApi.getOutgoingTransclusions(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents'],
    queryFn: async () => {
      const response = await documentApi.getAll();
      return response.data;
    },
    enabled: showTranscludeModal,
  });

  const { data: verification } = useQuery({
    queryKey: ['verification', document?.currentVersionId],
    queryFn: async () => {
      const response = await verificationApi.verifyVersion(document!.currentVersionId!);
      return response.data;
    },
    enabled: !!document?.currentVersionId,
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => documentApi.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate('/dashboard');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateDocumentRequest) =>
      documentApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      setIsEditing(false);
      alert('Document updated successfully!');
    },
  });

  const transcludeMutation = useMutation({
    mutationFn: (data: TranscludeRequest) =>
      documentApi.transclude(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transclusions-incoming', id] });
      queryClient.invalidateQueries({ queryKey: ['transclusions-outgoing', id] });
      setShowTranscludeModal(false);
      setTranscludeForm({ sourceDocumentId: '', sourceNodePath: '', targetNodePath: '' });
      alert('Transclusion created successfully!');
    },
  });

  const addSectionMutation = useMutation({
    mutationFn: (data: { contentType: string; value: string | number }) =>
      documentApi.addSection(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', id] });
      setShowAddSectionModal(false);
      setAddSectionForm({ contentType: 'STRING', value: '' });
      alert('Section added successfully!');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate(id!);
    }
  };

  const handleOpenEdit = () => {
    if (document) {
      setEditForm({
        title: document.title,
        content: document.contentJson?.content?.value || '',
        changeDescription: ''
      });
      setIsEditing(true);
    }
  };

  const canDelete = user?.id === document?.createdBy;
  const canEdit = user?.id === document?.createdBy;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading document...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Document not found</div>
      </div>
    );
  }

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
            </div>
            <div className="flex items-center space-x-4">
              {canEdit && (
                <button
                  onClick={handleOpenEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Edit Document
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Document'}
                </button>
              )}
              <span className="text-sm text-gray-500">{user?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Document Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{document.title}</h1>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {document.docType}
                  </span>
                  <span>
                    Created by{' '}
                    <button
                      onClick={() => navigate(`/users/${document.createdBy}`)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      {document.createdByName ?? 'Unknown'}
                    </button>
                  </span>
                  <span>{new Date(document.createdAt * 1000).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Version</p>
                <p className="text-2xl font-bold text-gray-900">
                  v{document.currentVersionNumber ?? 'N/A'}
                </p>
              </div>
            </div>

            {/* IOTA Verification Badge */}
            {verification && (
              <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">IOTA Verified</p>
                    <p className="text-xs text-green-700 mt-1">
                      Transaction ID: {verification.iotaTxId || 'N/A'}
                    </p>
                    <p className="text-xs text-green-700">
                      Hash: {verification.contentHash}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Content */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Content</h2>
              {document.currentVersionId && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddSectionModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm"
                  >
                    + Add Section
                  </button>
                  <button
                    onClick={() => setShowNodeStructure(!showNodeStructure)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm"
                  >
                    {showNodeStructure ? 'Hide Node Structure' : 'Show Node Structure'}
                  </button>
                </div>
              )}
            </div>
            <div className="prose max-w-none">
              {document.contentJson ? (
                renderContentTypeAware(document.contentJson)
              ) : (
                <p className="text-gray-500">No content available</p>
              )}
            </div>

            {/* Node Structure Viewer */}
            {showNodeStructure && document.currentVersionId && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Node Tree Structure</h3>
                <NodeTreeViewer documentId={id!} versionId={document.currentVersionId} />
              </div>
            )}
          </div>

          {/* Transclusion Management */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Transclusions</h2>
              <button
                onClick={() => setShowTranscludeModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                + Transclude Content
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'incoming'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Incoming ({incomingTransclusions?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'outgoing'
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Outgoing ({outgoingTransclusions?.length || 0})
                </button>
              </nav>
            </div>

            {/* Transclusion Lists */}
            <div className="space-y-2">
              {activeTab === 'incoming' ? (
                incomingTransclusions && incomingTransclusions.length > 0 ? (
                  incomingTransclusions.map(t => (
                    <div key={t.id} className="border rounded p-4 bg-purple-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-purple-900">
                            From: {t.sourceDocument?.title || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Source path: {t.sourceNodePath || 'Entire document'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Target path: {t.targetNodePath || 'Root'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(t.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      {t.iotaTxId && (
                        <div className="mt-2 text-xs text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          IOTA: {t.iotaTxId}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No incoming transclusions</p>
                )
              ) : (
                outgoingTransclusions && outgoingTransclusions.length > 0 ? (
                  outgoingTransclusions.map(t => (
                    <div key={t.id} className="border rounded p-4 bg-blue-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-blue-900">
                            To: {t.targetDocument?.title || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Source path: {t.sourceNodePath || 'Entire document'}
                          </p>
                          <p className="text-sm text-gray-600">
                            Target path: {t.targetNodePath || 'Root'}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(t.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      {t.iotaTxId && (
                        <div className="mt-2 text-xs text-green-600 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          IOTA: {t.iotaTxId}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No outgoing transclusions</p>
                )
              )}
            </div>
          </div>

          {/* Version History */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Version History</h2>
              {versions && versions.length > 1 && (
                <button
                  onClick={() => setShowVersionTreeModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
                >
                  📊 View Version Tree
                </button>
              )}
            </div>
            {versions && versions.length > 0 ? (
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          Version {version.versionNumber}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          By {version.author?.name ?? 'Unknown'} on{' '}
                          {new Date(version.createdAt * 1000).toLocaleString()}
                        </p>
                        {version.iotaTxId && (
                          <p className="text-xs text-gray-500 mt-1">
                            IOTA TX: {version.iotaTxId}
                          </p>
                        )}
                        {index < versions.length - 1 && (
                          <button
                            onClick={() => setComparisonData({
                              oldVersion: versions[index + 1],
                              newVersion: version
                            })}
                            className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Compare with v{versions[index + 1].versionNumber}
                          </button>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          version.id === document.currentVersionId
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {version.id === document.currentVersionId ? 'Current' : 'Old'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No version history available</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Document Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-xl font-bold mb-4">Edit Document</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate(editForm);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Description (optional)
                </label>
                <textarea
                  value={editForm.changeDescription}
                  onChange={(e) => setEditForm({...editForm, changeDescription: e.target.value})}
                  rows={3}
                  placeholder="Describe what changed in this version..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transclude Content Modal */}
      {showTranscludeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-xl font-bold mb-4">Transclude Content</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              transcludeMutation.mutate(transcludeForm);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Document *
                </label>
                <select
                  value={transcludeForm.sourceDocumentId}
                  onChange={(e) => setTranscludeForm({...transcludeForm, sourceDocumentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select source document...</option>
                  {allDocuments?.filter(d => d.id !== id).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} (v{doc.currentVersionNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Node Path (optional)
                </label>
                <input
                  type="text"
                  value={transcludeForm.sourceNodePath}
                  onChange={(e) => setTranscludeForm({...transcludeForm, sourceNodePath: e.target.value})}
                  placeholder="e.g., section-2.paragraph-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Node Path (optional)
                </label>
                <input
                  type="text"
                  value={transcludeForm.targetNodePath}
                  onChange={(e) => setTranscludeForm({...transcludeForm, targetNodePath: e.target.value})}
                  placeholder="e.g., section-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-4">
                <p className="text-sm text-purple-900">
                  <strong>Transclusion</strong> creates a reference to content from another document.
                  Leave paths empty to reference the entire document.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTranscludeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transcludeMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {transcludeMutation.isPending ? 'Creating...' : 'Create Transclusion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Comparison Modal */}
      {comparisonData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Version Comparison</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Comparing v{comparisonData.oldVersion.versionNumber} with v{comparisonData.newVersion.versionNumber}
                </p>
              </div>
              <button
                onClick={() => setComparisonData(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="font-medium text-red-900">Version {comparisonData.oldVersion.versionNumber}</p>
                <p className="text-gray-600">By {comparisonData.oldVersion.author?.name}</p>
                <p className="text-gray-600">{new Date(comparisonData.oldVersion.createdAt * 1000).toLocaleString()}</p>
                {comparisonData.oldVersion.iotaTxId && (
                  <p className="text-xs text-green-600 mt-1">IOTA: {comparisonData.oldVersion.iotaTxId}</p>
                )}
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="font-medium text-green-900">Version {comparisonData.newVersion.versionNumber}</p>
                <p className="text-gray-600">By {comparisonData.newVersion.author?.name}</p>
                <p className="text-gray-600">{new Date(comparisonData.newVersion.createdAt * 1000).toLocaleString()}</p>
                {comparisonData.newVersion.iotaTxId && (
                  <p className="text-xs text-green-600 mt-1">IOTA: {comparisonData.newVersion.iotaTxId}</p>
                )}
              </div>
            </div>

            {/* Diff Viewer */}
            <div className="border rounded-lg overflow-hidden">
              <ReactDiffViewer
                oldValue={extractContent(comparisonData.oldVersion.contentJson)}
                newValue={extractContent(comparisonData.newVersion.contentJson)}
                splitView={true}
                showDiffOnly={false}
                useDarkTheme={false}
                leftTitle={`Version ${comparisonData.oldVersion.versionNumber}`}
                rightTitle={`Version ${comparisonData.newVersion.versionNumber}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-xl font-bold mb-4">Add New Section</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              addSectionMutation.mutate({
                contentType: addSectionForm.contentType,
                value: addSectionForm.contentType === 'INTEGER'
                  ? Number(addSectionForm.value)
                  : String(addSectionForm.value)
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type *
                </label>
                <select
                  value={addSectionForm.contentType}
                  onChange={(e) => setAddSectionForm({
                    ...addSectionForm,
                    contentType: e.target.value as 'STRING' | 'INTEGER' | 'IMAGE',
                    value: '' // Reset value when type changes
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="STRING">String Content</option>
                  <option value="INTEGER">Integer Content</option>
                  <option value="IMAGE">Image Content</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose the type of content for this section
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value *
                </label>
                {addSectionForm.contentType === 'STRING' ? (
                  <textarea
                    value={addSectionForm.value as string}
                    onChange={(e) => setAddSectionForm({...addSectionForm, value: e.target.value})}
                    rows={6}
                    placeholder="Enter text content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                ) : addSectionForm.contentType === 'IMAGE' ? (
                  <input
                    type="url"
                    value={addSectionForm.value as string}
                    onChange={(e) => setAddSectionForm({...addSectionForm, value: e.target.value})}
                    placeholder="Enter image URL (e.g. https://example.com/ecg.png)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                ) : (
                  <input
                    type="number"
                    value={addSectionForm.value}
                    onChange={(e) => setAddSectionForm({...addSectionForm, value: e.target.value})}
                    placeholder="Enter integer value..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    required
                  />
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Xanadu Concept:</strong> This creates a new DocumentNode with typed Content
                  ({addSectionForm.contentType === 'STRING' ? 'StringContent' : addSectionForm.contentType === 'IMAGE' ? 'ImageContent' : 'IntegerContent'})
                  and adds it to the document tree. A new version will be created with IOTA verification.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSectionModal(false);
                    setAddSectionForm({ contentType: 'STRING', value: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSectionMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {addSectionMutation.isPending ? 'Adding...' : 'Add Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version Tree Modal */}
      {showVersionTreeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-5 border w-11/12 max-w-5xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Version Tree</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Visual representation of version history with parent-child relationships
                </p>
              </div>
              <button
                onClick={() => setShowVersionTreeModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Xanadu Concept:</strong> Version tree shows parent-child relationships between
                DocumentVersions. Green nodes indicate current version. Each version is notarized on IOTA.
              </p>
            </div>

            <VersionTreeGraph documentId={id!} />

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowVersionTreeModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
