import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('renders correctly for active status', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders correctly for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('applies the correct size classes when size is md', () => {
    const { container } = render(<StatusBadge status="active" size="md" />);
    const badgeSpan = container.firstChild as HTMLElement;
    expect(badgeSpan).toHaveClass('px-4', 'py-1', 'text-sm');
  });
});
