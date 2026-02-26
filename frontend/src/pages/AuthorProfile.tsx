import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import type { Document } from '../types';

export default function AuthorProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const response = await userApi.getProfile(userId!);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const response = await userApi.getStats(userId!);
      return response.data;
    },
    enabled: !!userId,
  });

  // Fetch user documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: async () => {
      const response = await userApi.getDocuments(userId!);
      return response.data;
    },
    enabled: !!userId,
  });

  const isLoading = profileLoading || statsLoading || documentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">User not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SPONSOR':
        return 'bg-purple-100 text-purple-800';
      case 'RESEARCHER':
        return 'bg-blue-100 text-blue-800';
      case 'HOSPITAL':
        return 'bg-green-100 text-green-800';
      case 'ETHICS_COMMITTEE':
        return 'bg-yellow-100 text-yellow-800';
      case 'AUDITOR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <h1 className="text-xl font-bold text-gray-900">Author Profile</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">{currentUser?.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-600 mt-1">{profile.email}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleBadgeColor(profile.role)}`}>
                  {profile.role}
                </span>
                {profile.organization && (
                  <span className="text-sm text-gray-600">
                    📍 {profile.organization}
                  </span>
                )}
              </div>
              {profile.iotaDid && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-xs font-semibold text-green-900 mb-1">IOTA DID</p>
                  <p className="text-xs text-green-700 font-mono break-all">{profile.iotaDid}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                Member since {new Date(profile.createdAt * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Created</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.documentsCreated || 0}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Original documents authored
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Versions Authored</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.versionsAuthored || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Document versions created
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transclusions Created</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.transclusionsCreated || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Xanadu transclusions made
            </p>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Documents by {profile.name}</h2>

          {documents && documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc: Document) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                        {doc.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {doc.docType}
                        </span>
                        {doc.currentVersionNumber && (
                          <span className="text-xs text-gray-600">
                            v{doc.currentVersionNumber}
                          </span>
                        )}
                        {doc.iotaTxId && (
                          <span className="text-xs text-green-600 flex items-center">
                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            IOTA Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {new Date(doc.createdAt * 1000).toLocaleDateString()} •
                        Updated {new Date(doc.updatedAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents created yet</p>
            </div>
          )}
        </div>

        {/* Xanadu Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900">
            <strong>Xanadu Concept:</strong> Author attribution tracking across all content created.
            Each Content object has an Author reference, and version history preserves authorship.
            This page demonstrates Author.getPublishedContent() concept.
          </p>
        </div>
      </div>
    </div>
  );
}
