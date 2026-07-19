import React from 'react';
import { Role } from '../types/permissions.types';
import { FiUsers } from 'react-icons/fi';

interface RoleListProps {
  roles: Role[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string) => void;
  isLoading: boolean;
}

export function RoleList({ roles, selectedRoleId, onSelectRole, isLoading }: RoleListProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-5 border-b border-gray-100 bg-gray-50/30">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <FiUsers className="w-4 h-4 text-gray-400" />
          Roles Directory
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center p-3 rounded-lg border border-transparent">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : roles.length > 0 ? (
          <ul className="space-y-1">
            {roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => onSelectRole(role.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all border ${
                      isSelected
                        ? 'bg-primary/5 border-primary/20 shadow-sm relative'
                        : 'bg-transparent border-transparent hover:bg-gray-50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md"></div>
                    )}
                    <div className={`font-medium text-sm capitalize ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                      {role.name}
                    </div>
                    {role.description && (
                      <div className={`text-xs mt-1 truncate ${isSelected ? 'text-primary/70' : 'text-gray-500'}`}>
                        {role.description}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center p-6 text-sm text-gray-500 italic">
            No roles found.
          </div>
        )}
      </div>
    </div>
  );
}
