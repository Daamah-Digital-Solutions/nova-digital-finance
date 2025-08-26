import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { requestService } from '../../services/requestService';

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ onClose, onSuccess }) => {
  const [requestTypes] = useState(requestService.getRequestTypeOptions());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Request
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose the type of request you'd like to create for your loan.
          </p>

          <div className="space-y-3">
            {requestTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  // For now, just show a message - in a full implementation,
                  // this would navigate to specific request creation forms
                  alert(`${type.label} request creation coming soon!`);
                  onClose();
                }}
                className="w-full text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">
                    {requestService.getRequestTypeIcon(type.value)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Request creation forms are currently in development. 
                You can view existing requests and their statuses using this interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestModal;