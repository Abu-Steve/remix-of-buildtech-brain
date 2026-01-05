export type DocumentStatus = 'pending' | 'approved' | 'best-practice' | 'rejected';

export type DocumentType = 'pdf' | 'excel' | 'presentation' | 'flowchart' | 'drawing' | 'image' | 'other';

export type UserRole = 'employee' | 'champion' | 'administrator';

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  type: DocumentType;
  status: DocumentStatus;
  tags: Tag[];
  uploadedBy: string;
  uploadedAt: Date;
  version: string;
  size: string;
  approvedBy?: string;
  approvedAt?: Date;
  rating?: number;
  downloads: number;
  isCached?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  skills: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  isExternal?: boolean;
}

export interface DocumentSource {
  id: string;
  title: string;
  page?: number;
  excerpt: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: Date;
  tags: Tag[];
  answers: number;
  views: number;
  isResolved: boolean;
}
