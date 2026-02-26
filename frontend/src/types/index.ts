export type Role =
  | 'SPONSOR'
  | 'RESEARCHER'
  | 'HOSPITAL'
  | 'ETHICS_COMMITTEE'
  | 'AUDITOR';

export type DocumentType =
  | 'PROTOCOL'
  | 'ICF'
  | 'AMENDMENT'
  | 'SAE_REPORT'
  | 'AUDIT_REPORT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organization?: string;
  iotaDid?: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: Role;
  organization?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

export interface Document {
  id: string;
  title: string;
  docType: DocumentType;
  createdBy: string; // UUID
  createdByName: string;
  currentVersionId?: string;
  currentVersionNumber?: number;
  contentJson?: Record<string, any>;
  contentHash?: string;
  iotaTxId?: string;
  createdAt: number; // Instant (epoch seconds)
  updatedAt: number; // Instant (epoch seconds)
}

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  contentJson: Record<string, any>;
  contentHash: string;
  author?: User;
  createdAt: number; // Instant (epoch seconds)
  iotaTxId?: string;
}

export interface CreateDocumentRequest {
  title: string;
  docType: DocumentType;
  initialContent: string;
}

export interface UpdateDocumentRequest {
  title: string;
  content: string;
  changeDescription?: string;
}

export interface TranscludeRequest {
  sourceDocumentId: string;
  sourceNodePath?: string;
  targetNodePath?: string;
}

export interface AddSectionRequest {
  contentType: 'STRING' | 'INTEGER' | 'IMAGE' | 'TRANSCLUSION';
  value: string | number;
  parentNodePath?: string;
}

export interface Transclusion {
  id: string;
  sourceDocument?: Document;
  sourceNodePath: string;
  targetDocument?: Document;
  targetNodePath: string;
  createdBy?: User;
  createdAt: number;
  iotaTxId?: string;
}

export interface VerificationResponse {
  verified: boolean;
  versionId: string;
  contentHash: string;
  iotaTxId?: string;
  documentTitle: string;
  versionNumber: number;
  createdAt: string;
}
