import React, { useState, useEffect } from 'react';
import { CreatePermissionPayload, Permission } from '../types/permissions.types';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePermissionPayload) => Promise<void>;
  initialData?: Permission | null;
}

export function PermissionFormModal({ isOpen, onClose, onSave, initialData }: PermissionFormModalProps) {
  const [formData, setFormData] = useState<CreatePermissionPayload>({
    name: '',
    resource: '',
    action: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        resource: initialData?.resource || '',
        action: initialData?.action || '',
        description: initialData?.description || '',
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.name.match(/^[a-z0-9_-]+:[a-z0-9_-]+$/)) {
      toast.error('System Name must follow resource:action format');
      setIsSaving(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to save permission');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-xl shadow-xl w-full min-w-[350px] sm:min-w-[500px] max-w-lg border border-gray-100 flex flex-col my-8 relative"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Permission' : 'New Permission'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close dialog"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto">

            <div>
              <label htmlFor="resource" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Name <span className="text-red-500">*</span>
              </label>
              <input
                id="resource"
                type="text"
                required
                placeholder="e.g., users, logs, resources"
                value={formData.resource}
                onChange={(e) => {
                  const resource = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  setFormData({ ...formData, resource, name: `${resource}:${formData.action}` });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">The entity this permission controls.</p>
            </div>

            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-1">
                Action <span className="text-red-500">*</span>
              </label>
              <input
                id="action"
                type="text"
                required
                placeholder="e.g., view, create, manage"
                value={formData.action}
                onChange={(e) => {
                  const action = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                  setFormData({ ...formData, action, name: `${formData.resource}:${action}` });
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">What the user can do with this resource.</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                System Name
              </label>
              <input
                id="name"
                type="text"
                readOnly
                value={formData.name || `${formData.resource}:${formData.action}`}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm transition-all font-mono text-gray-500 bg-gray-100 cursor-not-allowed select-all focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Automatically generated from resource and action.</p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Briefly describe what this permission allows..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-gray-900"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                initialData ? 'Save Changes' : 'Create Permission'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
