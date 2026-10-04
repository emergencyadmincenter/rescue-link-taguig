import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoleList } from './RoleList';
import { Role } from '../types/permissions.types';

const mockRoles: Role[] = [
  { id: 'role-1', name: 'admin', description: 'Administrator role' } as Role,
  { id: 'role-2', name: 'user', description: 'Standard user' } as Role,
];

describe('RoleList', () => {
  it('renders a list of roles', () => {
    render(<RoleList roles={mockRoles} selectedRoleId={null} onSelectRole={jest.fn()} isLoading={false} />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Administrator role')).toBeInTheDocument();
  });

  it('renders empty state when no roles', () => {
    render(<RoleList roles={[]} selectedRoleId={null} onSelectRole={jest.fn()} isLoading={false} />);
    expect(screen.getByText('No roles found.')).toBeInTheDocument();
  });

  it('calls onSelectRole when a role is clicked', () => {
    const onSelectRole = jest.fn();
    render(<RoleList roles={mockRoles} selectedRoleId={null} onSelectRole={onSelectRole} isLoading={false} />);
    fireEvent.click(screen.getByText('admin'));
    expect(onSelectRole).toHaveBeenCalledWith('role-1');
  });

  it('highlights the selected role', () => {
    const { container } = render(<RoleList roles={mockRoles} selectedRoleId="role-1" onSelectRole={jest.fn()} isLoading={false} />);
    const adminButton = screen.getByText('admin').closest('button');
    expect(adminButton).toHaveClass('bg-primary/5');
  });
});
