import api, { handleApiError } from './api';

// Types
export interface PRNWallet {
  id: string;
  user: string;
  wallet_address: string;
  balance: string;
  pledged_balance: string;
  available_balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PRNTransaction {
  id: string;
  transaction_type: 'issue' | 'pledge' | 'unpledge' | 'transfer' | 'burn';
  from_wallet: string | null;
  to_wallet: string | null;
  amount: string;
  fee_amount: string;
  status: 'pending' | 'completed' | 'failed';
  reference_id: string;
  reference_type: string;
  description: string;
  blockchain_tx_hash: string;
  created_at: string;
  completed_at: string | null;
}

export interface ElectronicCertificate {
  id: string;
  user: string;
  loan_application: string | null;
  certificate_number: string;
  certificate_type: 'ownership' | 'pledge' | 'release';
  prn_amount: string;
  usd_value: string;
  status: 'active' | 'pledged' | 'released' | 'revoked';
  issue_date: string;
  expiry_date: string | null;
  pdf_generated: boolean;
  pdf_file_path: string;
  blockchain_verified: boolean;
  blockchain_tx_hash: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CapimaxInvestment {
  id: string;
  user: string;
  certificate: string;
  capimax_position_id: string;
  investment_amount_usd: string;
  current_value_usd: string;
  profit_loss_usd: string;
  profit_loss_percentage: string;
  status: 'active' | 'closed' | 'pending';
  strategy: string;
  risk_level: string;
  opened_at: string;
  closed_at: string | null;
}

export interface PRNWalletBalance {
  balance: string;
  pledged_balance: string;
  available_balance: string;
  wallet_address: string;
}

// Pronova Service
const pronovaService = {
  // Get user's PRN wallet
  getWallet: async (): Promise<PRNWallet> => {
    try {
      const response = await api.get<PRNWallet>('/pronova/wallet/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get wallet balance
  getWalletBalance: async (): Promise<PRNWalletBalance> => {
    try {
      const response = await api.get<PRNWalletBalance>('/pronova/wallet/balance/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get PRN transactions
  getTransactions: async (): Promise<PRNTransaction[]> => {
    try {
      const response = await api.get<PRNTransaction[]>('/pronova/transactions/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get user's certificates
  getCertificates: async (): Promise<ElectronicCertificate[]> => {
    try {
      const response = await api.get<ElectronicCertificate[]>('/pronova/certificates/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single certificate
  getCertificate: async (id: string): Promise<ElectronicCertificate> => {
    try {
      const response = await api.get<ElectronicCertificate>(`/pronova/certificates/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Generate certificate PDF
  generateCertificatePDF: async (certificateId: string): Promise<{
    message: string;
    certificate_id: string;
    pdf_generated: boolean;
    download_url: string;
  }> => {
    try {
      const response = await api.post(`/pronova/certificates/${certificateId}/generate-pdf/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Download certificate PDF
  downloadCertificate: async (certificateId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/pronova/certificates/${certificateId}/download/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get Capimax investments
  getCapimaxInvestments: async (): Promise<CapimaxInvestment[]> => {
    try {
      const response = await api.get<CapimaxInvestment[]>('/pronova/capimax-investments/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Get single Capimax investment
  getCapimaxInvestment: async (id: string): Promise<CapimaxInvestment> => {
    try {
      const response = await api.get<CapimaxInvestment>(`/pronova/capimax-investments/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Verify certificate on blockchain
  verifyCertificate: async (certificateId: string): Promise<{
    verified: boolean;
    blockchain_data: Record<string, unknown>;
  }> => {
    try {
      const response = await api.get(`/pronova/certificates/${certificateId}/verify/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },
};

export default pronovaService;
