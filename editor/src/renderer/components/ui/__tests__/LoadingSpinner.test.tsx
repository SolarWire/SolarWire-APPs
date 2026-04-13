import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default size', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('loading-spinner--medium'); // 默认 medium
  });

  it('should render with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--small');
  });

  it('should render with medium size', () => {
    render(<LoadingSpinner size="medium" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--medium');
  });

  it('should render with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('should display custom message', () => {
    render(<LoadingSpinner text="Loading..." />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should apply overlay when specified', () => {
    render(<LoadingSpinner overlay />);
    
    const overlay = document.querySelector('.loading-overlay');
    expect(overlay).toBeInTheDocument();
  });
});
