import api from './api';

export interface Document {
  id: string;
  user: {
    id: string;
    username: string;
  };
  loan_application?: string;
  loan?: string;
  payment?: string;
  document_type: string;
  document_type_display: string;
  title: string;
  document_number: string;
  template_used?: any;
  generated_data: any;
  status: string;
  status_display: string;
  is_public: boolean;
  download_url?: string;
  digital_signature?: string;
  signature_timestamp?: string;
  email_sent: boolean;
  email_sent_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export interface DocumentShare {
  id: string;
  document: Document;
  shared_by: {
    id: string;
    username: string;
  };
  share_token: string;
  shared_with_email?: string;
  can_download: boolean;
  password_protected: boolean;
  access_count: number;
  max_access_count?: number;
  share_url: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

export interface ElectronicSignature {
  id: string;
  document: string;
  user: {
    id: string;
    username: string;
  };
  signature_type: string;
  signature_type_display: string;
  signature_method: string;
  ip_address: string;
  user_agent: string;
  geolocation: any;
  signed_at: string;
  is_valid: boolean;
}

class DocumentService {
  // Get user's documents
  async getDocuments(): Promise<Document[]> {
    const response = await api.get('/documents/documents/');
    return response.data.results || response.data;
  }

  // Get specific document
  async getDocument(id: string): Promise<Document> {
    const response = await api.get(`/documents/documents/${id}/`);
    return response.data;
  }

  // Create new document
  async createDocument(data: {
    document_type: string;
    title: string;
    loan_application?: string;
    loan?: string;
    payment?: string;
  }): Promise<Document> {
    const response = await api.post('/documents/documents/', data);
    return response.data;
  }

  // Download document PDF
  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get(`/documents/documents/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Sign document electronically
  async signDocument(id: string, signatureData: {
    signature_data: string;
    signature_method: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<ElectronicSignature> {
    const response = await api.post(`/documents/documents/${id}/sign/`, signatureData);
    return response.data;
  }

  // Send document via email
  async sendDocumentEmail(id: string, email?: string): Promise<{ message: string }> {
    const response = await api.post(`/documents/documents/${id}/send_email/`, {
      email: email
    });
    return response.data;
  }

  // Share document
  async shareDocument(id: string, shareData: {
    shared_with_email?: string;
    can_download: boolean;
    password_protected: boolean;
    max_access_count?: number;
    expires_at: string;
  }): Promise<DocumentShare> {
    const response = await api.post(`/documents/documents/${id}/share/`, shareData);
    return response.data;
  }

  // Get document templates
  async getTemplates(type?: string): Promise<DocumentTemplate[]> {
    const params = type ? { type } : {};
    const response = await api.get('/documents/templates/', { params });
    return response.data.results || response.data;
  }

  // Generate documents for loan
  async generateLoanDocuments(loanId: string): Promise<Document[]> {
    const response = await api.post(`/documents/generate/loan/${loanId}/`);
    return response.data;
  }

  // Generate documents for application
  async generateApplicationDocuments(applicationId: string): Promise<Document[]> {
    const response = await api.post(`/documents/generate/application/${applicationId}/`);
    return response.data;
  }

  // Generate both loan and application documents
  async generateBothDocuments(loanId: string, applicationId: string): Promise<Document[]> {
    const response = await api.post(`/documents/generate/both/${loanId}/${applicationId}/`);
    return response.data;
  }

  // Access shared document
  async getSharedDocument(token: string): Promise<{
    document: Document;
    share_info: {
      shared_by: string;
      can_download: boolean;
      access_count: number;
      max_access_count?: number;
      expires_at: string;
    };
  }> {
    const response = await api.get(`/documents/documents/shared/${token}/`);
    return response.data;
  }

  // Get document access logs
  async getAccessLogs(): Promise<any[]> {
    const response = await api.get('/documents/access-logs/');
    return response.data.results || response.data;
  }

  // Helper function to get document type icon
  getDocumentTypeIcon(type: string): string {
    switch (type) {
      case 'loan_certificate':
        return '📜';
      case 'financing_contract':
        return '📋';
      case 'kyc_report':
        return '🆔';
      case 'payment_receipt':
        return '🧾';
      case 'investment_certificate':
        return '📊';
      default:
        return '📄';
    }
  }

  // Helper function to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return 'gray';
      case 'generated':
        return 'blue';
      case 'signed':
        return 'green';
      case 'delivered':
        return 'purple';
      default:
        return 'gray';
    }
  }

  // Helper function to format document title
  formatDocumentTitle(document: Document): string {
    const date = new Date(document.created_at).toLocaleDateString();
    return `${document.title} - ${date}`;
  }

  // Helper function to check if document can be downloaded
  canDownload(document: Document): boolean {
    // Allow download for all documents - backend will generate PDFs on-demand
    return true;
  }

  // Helper function to check if document can be signed
  canSign(document: Document): boolean {
    return document.status === 'generated' && !document.digital_signature;
  }

  // Helper function to check if document can be shared
  canShare(document: Document): boolean {
    return document.status === 'signed' || document.status === 'delivered';
  }

}

export const documentService = new DocumentService();
export default documentService;