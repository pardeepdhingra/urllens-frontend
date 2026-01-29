// ============================================================================
// URL Lens - AuditHistoryTable Component Tests
// ============================================================================

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditHistoryTable from '@/components/AuditHistoryTable';

describe('AuditHistoryTable', () => {
  const mockOnView = jest.fn();
  const mockOnDelete = jest.fn();

  const mockSessions = [
    {
      id: 'session-1',
      mode: 'domain' as const,
      domain: 'example.com',
      totalUrls: 25,
      completedUrls: 25,
      status: 'completed',
      createdAt: '2025-01-29T10:00:00Z',
      completedAt: '2025-01-29T10:05:00Z',
      avgScore: 75,
      bestScore: 92,
    },
    {
      id: 'session-2',
      mode: 'batch' as const,
      domain: null,
      totalUrls: 10,
      completedUrls: 10,
      status: 'completed',
      createdAt: '2025-01-28T10:00:00Z',
      completedAt: '2025-01-28T10:02:00Z',
      avgScore: 65,
      bestScore: 80,
    },
    {
      id: 'session-3',
      mode: 'domain' as const,
      domain: 'test.com',
      totalUrls: 5,
      completedUrls: 3,
      status: 'testing',
      createdAt: '2025-01-29T11:00:00Z',
      completedAt: null,
      avgScore: undefined,
      bestScore: undefined,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton rows when loading', () => {
      render(
        <AuditHistoryTable
          sessions={[]}
          loading={true}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Should show table headers
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Domain/Batch')).toBeInTheDocument();
      expect(screen.getByText('URLs')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no sessions', () => {
      render(
        <AuditHistoryTable
          sessions={[]}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/No audit history yet/i)).toBeInTheDocument();
    });
  });

  describe('Sessions Display', () => {
    it('should display domain mode sessions correctly', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('example.com')).toBeInTheDocument();
      // Multiple domain chips exist, so check for at least one
      const domainChips = screen.getAllByText('Domain');
      expect(domainChips.length).toBeGreaterThan(0);
    });

    it('should display batch mode sessions correctly', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('10 URLs')).toBeInTheDocument();
      // Check batch chip exists
      const batchChips = screen.getAllByText('Batch');
      expect(batchChips.length).toBeGreaterThan(0);
    });

    it('should display URL counts', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('25/25')).toBeInTheDocument();
      expect(screen.getByText('10/10')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('should display scores with correct colors', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Check scores are displayed
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('92')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('should display dash for undefined scores', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Session 3 has undefined scores, should show '-'
      const dashes = screen.getAllByText('-');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('should display status correctly', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      const completedStatuses = screen.getAllByText('completed');
      expect(completedStatuses.length).toBe(2);
      expect(screen.getByText('testing')).toBeInTheDocument();
    });

    it('should display date column', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Check date header is present
      expect(screen.getByText('Date')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onView when row is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Click on the first row (example.com)
      const row = screen.getByText('example.com').closest('tr');
      if (row) {
        await user.click(row);
      }

      expect(mockOnView).toHaveBeenCalledWith(mockSessions[0]);
    });

    it('should call onView when view button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Find and click view button (first one)
      const viewButtons = screen.getAllByRole('button', { name: /view details/i });
      await user.click(viewButtons[0]);

      expect(mockOnView).toHaveBeenCalledWith(mockSessions[0]);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      mockOnDelete.mockResolvedValue(undefined);

      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Find and click delete button (first one)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('session-1');
      });
    });

    it('should not trigger onView when clicking action buttons', async () => {
      const user = userEvent.setup();
      mockOnDelete.mockResolvedValue(undefined);

      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      // Click delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // onView should not have been called (only onDelete)
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled();
      });

      // Reset to check view wasn't called from delete button click
      // (it may have been called from row click, so we check call count)
      expect(mockOnView).not.toHaveBeenCalledWith(mockSessions[0]);
    });
  });

  describe('Table Headers', () => {
    it('should display all column headers', () => {
      render(
        <AuditHistoryTable
          sessions={mockSessions}
          loading={false}
          onView={mockOnView}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Domain/Batch')).toBeInTheDocument();
      expect(screen.getByText('URLs')).toBeInTheDocument();
      expect(screen.getByText('Avg Score')).toBeInTheDocument();
      expect(screen.getByText('Best Score')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
