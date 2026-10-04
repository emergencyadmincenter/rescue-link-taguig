import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LogCard from './LogCard';
import { Log } from '../types/logs.types';

const mockLog = {
  id: 'log-1',
  reference_no: 'REF-001',
  status: 'active',
  source: 'manual',
  caller_name: 'John Doe',
  caller_contact: '1234567890',
  address: '123 Main St',
  description: 'Emergency description here',
  created_at: new Date().toISOString(),
  assigned_coordinator: {
    id: 'coord-1',
    name: 'Jane Smith',
    email: 'jane@example.com'
  },
  is_shadow_banned: false,
} as Log;

describe('LogCard', () => {
  it('renders log details', () => {
    render(<LogCard log={mockLog} onClick={jest.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Emergency description here')).toBeInTheDocument();
    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('Coord: Jane Smith')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<LogCard log={mockLog} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledWith('log-1');
  });

  it('shows shadow banned badge if log is shadow banned', () => {
    render(<LogCard log={{ ...mockLog, is_shadow_banned: true }} onClick={jest.fn()} />);
    expect(screen.getByText('Shadow Banned')).toBeInTheDocument();
  });
});
