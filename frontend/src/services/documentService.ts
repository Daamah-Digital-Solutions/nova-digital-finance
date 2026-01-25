import api, { handleApiError } from './api';

// Types
export interface Document {
  id: string;
  user: string;
  loan_application?: string;
  loan?: string;
  payment?: string;
  document_type: 'loan_certificate' | 'financing_contract' | 'kyc_report' | 'payment_receipt' | 'investment_certificate';
  title: string;
  document_number: string;
  template_used?: string;
  generated_data: Record<string, unknown>;
  pdf_file: string | null;
  html_content: string;
  status: 'draft' | 'generated' | 'signed' | 'delivered';
  is_public: boolean;
  digital_signature: string;
  signature_timestamp: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElectronicSignature {
  id: string;
  document: string;
  user: string;
  signature_type: 'simple' | 'advanced' | 'qualified';
  signature_data: string;
  signature_method: 'canvas' | 'typed' | 'uploaded';
  ip_address: string;
  user_agent: string;
  geolocation: Record<string, unknown>;
  certificate_data: string;
  verification_hash: string;
  signed_at: string;
  is_valid: boolean;
}

export interface DocumentShare {
  id: string;
  document: string;
  share_token: string;
  shared_with_email: string;
  can_download: boolean;
  password_protected: boolean;
  access_count: number;
  max_access_count: number | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export interface SignDocumentRequest {
  signature_data: string;
  signature_method: 'canvas' | 'typed' | 'uploaded';
}

// Document Service
const documentService = {
  // Get user's documents
  getDocuments: async (filters?: {
    document_type?: string;
    status?: string;
  }): Promise<Document[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.document_type) params.append('document_type', filters.document_type);
      if (filters?.status) params.append('status', filters.status);

      const queryString = params.toString();
      const url = queryString ? `/documents/?${queryString}` : '/documents/';

      const response = await api.get<Document[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single document
  getDocument: async (id: string): Promise<Document> => {
    try {
      const response = await api.get<Document>(`/documents/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Download document PDF
  downloadDocument: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/documents/${id}/download/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Sign document
  signDocument: async (id: string, signatureData: SignDocumentRequest): Promise<{
    message: string;
    document: Document;
    signature: ElectronicSignature;
  }> => {
    try {
      const response = await api.post(`/documents/${id}/sign/`, signatureData);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get document signatures
  getSignatures: async (documentId: string): Promise<ElectronicSignature[]> => {
    try {
      const response = await api.get<ElectronicSignature[]>(`/documents/${documentId}/signatures/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Verify signature
  verifySignature: async (signatureId: string): Promise<{
    is_valid: boolean;
    verification_details: Record<string, unknown>;
  }> => {
    try {
      const response = await api.get(`/documents/signatures/${signatureId}/verify/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Share document
  shareDocument: async (id: string, options: {
    shared_with_email?: string;
    can_download?: boolean;
    password?: string;
    max_access_count?: number;
    expires_in_days?: number;
  }): Promise<DocumentShare> => {
    try {
      const response = await api.post<DocumentShare>(`/documents/${id}/share/`, options);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get shared documents
  getSharedDocuments: async (): Promise<DocumentShare[]> => {
    try {
      const response = await api.get<DocumentShare[]>('/documents/shared/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Revoke share
  revokeShare: async (shareId: string): Promise<void> => {
    try {
      await api.delete(`/documents/shares/${shareId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Send document via email
  sendDocumentEmail: async (id: string, recipientEmail?: string): Promise<{ message: string }> => {
    try {
      const response = await api.post(`/documents/${id}/send-email/`, {
        recipient_email: recipientEmail,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Generate document (for admins)
  generateDocument: async (type: string, entityId: string): Promise<Document> => {
    try {
      const response = await api.post<Document>('/documents/generate/', {
        document_type: type,
        entity_id: entityId,
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default documentService;
