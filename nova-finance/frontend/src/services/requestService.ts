import api from './api';

export interface LoanRequest {
  id: string;
  user: {
    id: string;
    username: string;
  };
  loan: {
    id: string;
    loan_number: string;
    principal_amount_usd: string;
    monthly_payment_usd: string;
    currency: {
      symbol: string;
      name: string;
    };
  };
  request_type: string;
  request_type_display: string;
  request_number: string;
  title: string;
  description: string;
  reason: string;
  request_data: any;
  requested_amount_usd?: string;
  current_balance_usd?: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  approved_by?: {
    id: string;
    username: string;
  };
  approved_at?: string;
  rejection_reason?: string;
  fee_amount_usd: string;
  new_monthly_payment_usd?: string;
  new_final_payment_date?: string;
  requested_at: string;
  updated_at: string;
  completed_at?: string;
  customer_notes?: string;
}

export interface DetailedLoanRequest extends LoanRequest {
  increase_details?: {
    current_amount_usd: string;
    current_monthly_payment: string;
    increase_amount_usd: string;
    increase_reason: string;
    increase_reason_display: string;
    new_total_amount_usd: string;
    new_monthly_payment_usd?: string;
    new_duration_months?: number;
    processing_fee_usd: string;
    income_verification_required: boolean;
    additional_documents_required: boolean;
    credit_check_required: boolean;
  };
  settlement_details?: {
    settlement_type: string;
    settlement_type_display: string;
    current_outstanding_balance: string;
    current_monthly_payment: string;
    remaining_payments: number;
    settlement_amount_usd: string;
    discount_amount_usd: string;
    settlement_fee_usd: string;
    settlement_deadline: string;
    payment_method: string;
    total_savings_usd: string;
    interest_savings_usd: string;
  };
  deferral_details?: {
    deferral_reason: string;
    deferral_reason_display: string;
    requested_months: number;
    next_payment_due: string;
    monthly_payment_amount: string;
    new_payment_start_date?: string;
    new_final_payment_date?: string;
    deferral_fee_usd: string;
    expected_income_recovery_date?: string;
    proposed_catch_up_plan?: string;
    hardship_documentation_provided: boolean;
    alternative_payment_plan?: string;
  };
  status_history: Array<{
    id: string;
    old_status: string;
    old_status_display: string;
    new_status: string;
    new_status_display: string;
    changed_by?: {
      id: string;
      username: string;
    };
    change_reason?: string;
    changed_at: string;
  }>;
  comments: Array<{
    id: string;
    author?: {
      id: string;
      username: string;
    };
    comment_type: string;
    comment_type_display: string;
    content: string;
    is_internal: boolean;
    is_important: boolean;
    created_at: string;
    updated_at: string;
  }>;
  approval_steps: Array<{
    id: string;
    step_name: string;
    step_name_display: string;
    step_order: number;
    status: string;
    status_display: string;
    assigned_to?: {
      id: string;
      username: string;
    };
    completed_by?: {
      id: string;
      username: string;
    };
    notes?: string;
    decision?: string;
    created_at: string;
    completed_at?: string;
  }>;
}

export interface RequestStatistics {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  completed_requests: number;
  request_types: Record<string, number>;
}

export interface RequestEligibility {
  eligible: boolean;
  reason: string;
  requirements?: string[];
}

class RequestService {
  // Get user's loan requests
  async getLoanRequests(): Promise<LoanRequest[]> {
    const response = await api.get('/requests/loan-requests/');
    return response.data.results || response.data;
  }

  // Get detailed loan request
  async getLoanRequest(id: string): Promise<DetailedLoanRequest> {
    const response = await api.get(`/requests/loan-requests/${id}/`);
    return response.data;
  }

  // Create loan increase request
  async createIncreaseRequest(data: {
    loan_id: string;
    increase_amount_usd: string;
    increase_reason: string;
    description: string;
    reason: string;
  }): Promise<DetailedLoanRequest> {
    const response = await api.post('/requests/loan-requests/create_increase/', data);
    return response.data;
  }

  // Create settlement request
  async createSettlementRequest(data: {
    loan_id: string;
    settlement_type: string;
    description?: string;
    reason?: string;
  }): Promise<DetailedLoanRequest> {
    const response = await api.post('/requests/loan-requests/create_settlement/', data);
    return response.data;
  }

  // Create deferral request
  async createDeferralRequest(data: {
    loan_id: string;
    requested_months: number;
    deferral_reason: string;
    description: string;
    reason: string;
    expected_recovery_date?: string;
    catch_up_plan?: string;
  }): Promise<DetailedLoanRequest> {
    const response = await api.post('/requests/loan-requests/create_deferral/', data);
    return response.data;
  }

  // Cancel request
  async cancelRequest(id: string): Promise<DetailedLoanRequest> {
    const response = await api.post(`/requests/loan-requests/${id}/cancel/`);
    return response.data;
  }

  // Add comment to request
  async addComment(requestId: string, data: {
    content: string;
    is_important: boolean;
  }): Promise<any> {
    const response = await api.post(`/requests/loan-requests/${requestId}/add_comment/`, data);
    return response.data;
  }

  // Check request eligibility
  async checkEligibility(loanId: string, requestType: string): Promise<RequestEligibility> {
    const response = await api.post('/requests/eligibility/', {
      loan_id: loanId,
      request_type: requestType
    });
    return response.data;
  }

  // Get request statistics
  async getStatistics(): Promise<RequestStatistics> {
    const response = await api.get('/requests/loan-requests/statistics/');
    return response.data;
  }

  // Get request comments
  async getComments(): Promise<any[]> {
    const response = await api.get('/requests/comments/');
    return response.data.results || response.data;
  }

  // Get request history
  async getHistory(): Promise<any[]> {
    const response = await api.get('/requests/history/');
    return response.data.results || response.data;
  }

  // Helper functions
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'under_review':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'completed':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      case 'medium':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300';
      case 'urgent':
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getRequestTypeIcon(requestType: string): string {
    switch (requestType) {
      case 'increase':
        return '📈';
      case 'settlement':
        return '💰';
      case 'deferral':
        return '⏳';
      case 'restructure':
        return '🔄';
      case 'extension':
        return '📅';
      case 'partial_settlement':
        return '💳';
      case 'currency_change':
        return '💱';
      case 'payment_plan':
        return '📋';
      default:
        return '📄';
    }
  }

  formatCurrency(amount: string): string {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canCancelRequest(request: LoanRequest): boolean {
    return ['pending', 'under_review'].includes(request.status);
  }

  getRequestTypeOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'increase',
        label: 'Loan Amount Increase',
        description: 'Request to increase your current loan amount'
      },
      {
        value: 'settlement',
        label: 'Early Settlement',
        description: 'Pay off your loan early with potential discount'
      },
      {
        value: 'deferral',
        label: 'Payment Deferral',
        description: 'Temporarily postpone payments due to hardship'
      },
      {
        value: 'restructure',
        label: 'Loan Restructuring',
        description: 'Modify loan terms and payment schedule'
      },
      {
        value: 'extension',
        label: 'Loan Extension',
        description: 'Extend the loan duration to reduce monthly payments'
      }
    ];
  }

  getIncreaseReasons(): Array<{ value: string; label: string }> {
    return [
      { value: 'business_expansion', label: 'Business Expansion' },
      { value: 'investment_opportunity', label: 'Investment Opportunity' },
      { value: 'emergency_expense', label: 'Emergency Expense' },
      { value: 'debt_consolidation', label: 'Debt Consolidation' },
      { value: 'market_opportunity', label: 'Market Opportunity' },
      { value: 'other', label: 'Other' }
    ];
  }

  getDeferralReasons(): Array<{ value: string; label: string }> {
    return [
      { value: 'financial_hardship', label: 'Financial Hardship' },
      { value: 'job_loss', label: 'Job Loss' },
      { value: 'medical_emergency', label: 'Medical Emergency' },
      { value: 'business_disruption', label: 'Business Disruption' },
      { value: 'natural_disaster', label: 'Natural Disaster' },
      { value: 'other', label: 'Other' }
    ];
  }
}

export const requestService = new RequestService();
export default requestService;