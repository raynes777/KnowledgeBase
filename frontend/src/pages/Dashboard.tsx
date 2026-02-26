import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { documentApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { DocumentType, CreateDocumentRequest, Document } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentRequest>({
    title: '',
    docType: 'PROTOCOL',
    initialContent: '',
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await documentApi.getAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDocumentRequest) => documentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowCreateForm(false);
      setFormData({ title: '', docType: 'PROTOCOL', initialContent: '' });
    },
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const canCreateDocument = user?.role && ['SPONSOR', 'RESEARCHER', 'HOSPITAL'].includes(user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Clinical Trial Documentation</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/graph')}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium"
              >
                📊 View Transclusion Graph
              </button>
              <button
                onClick={() => navigate('/links')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
              >
                🔗 Link Explorer
              </button>
              {canCreateDocument && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
                >
                  {showCreateForm ? 'Cancel' : 'Create Document'}
                </button>
              )}
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Document</h3>
              <form onSubmit={handleCreateDocument} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <select
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.docType}
                    onChange={(e) =>
                      setFormData({ ...formData, docType: e.target.value as DocumentType })
                    }
                  >
                    <option value="PROTOCOL">Protocol</option>
                    <option value="ICF">Informed Consent Form</option>
                    <option value="AMENDMENT">Amendment</option>
                    <option value="SAE_REPORT">SAE Report</option>
                    <option value="AUDIT_REPORT">Audit Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Content</label>
                  <textarea
                    required
                    rows={6}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.initialContent}
                    onChange={(e) => setFormData({ ...formData, initialContent: e.target.value })}
                    placeholder="Enter the initial content of the document..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Documents List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading documents...</div>
            ) : documents && documents.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {documents.map((doc: Document) => (
                  <li
                    key={doc.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-lg font-medium text-indigo-600 truncate">{doc.title}</p>
                          <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doc.docType}
                            </span>
                            <span>Version {doc.currentVersionNumber ?? 'N/A'}</span>
                            <span>Created by {doc.createdByName ?? 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 text-sm text-gray-500">
                          {new Date(doc.createdAt * 1000).toLocaleDateString()}
                        </div>
                      </div>
                      {doc.iotaTxId && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <svg
                            className="h-4 w-4 text-green-500 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          IOTA Verified: {doc.iotaTxId}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No documents found. {canCreateDocument && 'Create your first document!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
