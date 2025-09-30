// src/components/__tests__/LoadingStates.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  PageLoader,
  Spinner,
  LoadingOverlay,
  CardSkeleton,
} from '../LoadingStates';

describe('LoadingStates Components', () => {
  describe('PageLoader', () => {
    test('should render with default message', () => {
      render(<PageLoader />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should render with custom message', () => {
      render(<PageLoader message="Please wait..." />);
      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });

    test('should contain spinner animation', () => {
      const { container } = render(<PageLoader />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Spinner', () => {
    test('should render small spinner', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('.h-4');
      expect(spinner).toBeInTheDocument();
    });

    test('should render medium spinner by default', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('.h-6');
      expect(spinner).toBeInTheDocument();
    });

    test('should render large spinner', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('.h-8');
      expect(spinner).toBeInTheDocument();
    });

    test('should apply custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      const spinner = container.querySelector('.custom-class');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('LoadingOverlay', () => {
    test('should render with default message', () => {
      render(<LoadingOverlay />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('should render with custom message', () => {
      render(<LoadingOverlay message="Saving data..." />);
      expect(screen.getByText('Saving data...')).toBeInTheDocument();
    });

    test('should have backdrop blur styling', () => {
      const { container } = render(<LoadingOverlay />);
      const overlay = container.querySelector('.backdrop-blur-sm');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('CardSkeleton', () => {
    test('should render single skeleton by default', () => {
      const { container } = render(<CardSkeleton />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(1);
    });

    test('should render multiple skeletons', () => {
      const { container } = render(<CardSkeleton count={3} />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBe(3);
    });
  });
});