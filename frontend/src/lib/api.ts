import axios from 'axios';
import { authStorage } from './auth';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Document,
  CreateDocumentRequest,
  DocumentVersion,
  VerificationResponse,
  UpdateDocumentRequest,
  TranscludeRequest,
  Transclusion,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<{ message: string; userId: string; iotaDid?: string }>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),
};

// Document endpoints
export const documentApi = {
  create: (data: CreateDocumentRequest) =>
    api.post<Document>('/documents', data),

  getAll: () =>
    api.get<Document[]>('/documents'),

  getById: (id: string) =>
    api.get<Document>(`/documents/${id}`),

  getVersions: (id: string) =>
    api.get<DocumentVersion[]>(`/documents/${id}/versions`),

  delete: (id: string) =>
    api.delete(`/documents/${id}`),

  update: (id: string, data: UpdateDocumentRequest) =>
    api.put<Document>(`/documents/${id}`, data),

  transclude: (targetDocId: string, data: TranscludeRequest) =>
    api.post<Transclusion>(`/documents/${targetDocId}/transclude`, data),

  getIncomingTransclusions: (id: string) =>
    api.get<Transclusion[]>(`/documents/${id}/transclusions/incoming`),

  getOutgoingTransclusions: (id: string) =>
    api.get<Transclusion[]>(`/documents/${id}/transclusions/outgoing`),

  // Feature 4: Node Structure
  getNodeStructure: (documentId: string, versionId: string) =>
    api.get(`/documents/${documentId}/versions/${versionId}/structure`),

  // Feature 2: Links
  getDocumentLinks: (documentId: string) =>
    api.get(`/documents/${documentId}/links`),

  // Feature 5: Add Section
  addSection: (documentId: string, data: any) =>
    api.post(`/documents/${documentId}/sections`, data),

  // Feature 3: Version Tree
  getVersionTree: (documentId: string) =>
    api.get(`/documents/${documentId}/version-tree`),
};

// Verification endpoints
export const verificationApi = {
  verifyVersion: (versionId: string) =>
    api.get<VerificationResponse>(`/verification/version/${versionId}`),
};

// User endpoints
export const userApi = {
  getProfile: (userId: string) =>
    api.get<any>(`/users/${userId}`),

  getDocuments: (userId: string) =>
    api.get<Document[]>(`/users/${userId}/documents`),

  getStats: (userId: string) =>
    api.get<any>(`/users/${userId}/stats`),
};

export default api;
