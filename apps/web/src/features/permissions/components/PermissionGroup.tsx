import React from 'react';
import { Permission } from '../types/permissions.types';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface PermissionGroupProps {
  resource: string;
  permissions: Permission[];
  selectedPermissionIds: Set<string>;
  onTogglePermission: (permissionId: string) => void;
  onEditPermission: (permission: Permission) => void;
  onDeletePermission: (permissionId: string) => void;
  updatingPermissionId?: string | null;
}

export function PermissionGroup({ 
  resource, 
  permissions, 
  selectedPermissionIds, 
  onTogglePermission,
  onEditPermission,
  onDeletePermission,
  updatingPermissionId
}: PermissionGroupProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="bg-gray-50/80 px-5 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 capitalize tracking-wide flex items-center gap-2">
          {resource} <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">{permissions.length}</span>
        </h3>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {permissions.map((perm) => {
            const isChecked = selectedPermissionIds.has(perm.id);
            return (
              <div 
                key={perm.id} 
                className={`relative flex items-start space-x-3 p-4 rounded-lg border transition-all group ${
                  isChecked 
                    ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${updatingPermissionId === perm.id ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <label className={`flex flex-1 items-start space-x-3 h-full w-full ${updatingPermissionId === perm.id ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="flex h-5 items-center mt-0.5 shrink-0 relative">
                    {updatingPermissionId === perm.id ? (
                      <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-offset-0 transition-colors cursor-pointer"
                        checked={isChecked}
                        onChange={() => onTogglePermission(perm.id)}
                        disabled={!!updatingPermissionId}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6 flex flex-col justify-center">
                    <div className={`text-sm font-medium capitalize break-words ${isChecked ? 'text-primary' : 'text-gray-900'}`}>
                      {perm.action}
                    </div>
                    {perm.description && (
                      <div className="text-xs text-gray-500 mt-1 break-words leading-relaxed">
                        {perm.description}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 font-mono mt-2 bg-gray-100/50 inline-block px-1.5 py-0.5 rounded w-max max-w-full truncate">
                      {perm.name}
                    </div>
                  </div>
                </label>
                
                {/* Admin Actions Toolbar */}
                <div className="absolute top-2 right-2 flex bg-white/80 backdrop-blur-sm rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-gray-100">
                  <button 
                    onClick={() => onEditPermission(perm)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors rounded-l"
                    title="Edit System Permission"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px bg-gray-100 my-1"></div>
                  <button 
                    onClick={() => onDeletePermission(perm.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-r"
                    title="Delete System Permission"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
