// ============================================================================
// URL Lens - URLInput Component Tests
// ============================================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import URLInput from '@/components/URLInput';

// Mock MUI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
  };
});

describe('URLInput Component', () => {
  const mockOnAnalyze = jest.fn();

  beforeEach(() => {
    mockOnAnalyze.mockClear();
  });

  it('renders input field and button', () => {
    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  it('calls onAnalyze with URL when form is submitted', async () => {
    const user = userEvent.setup();
    mockOnAnalyze.mockResolvedValue(undefined);

    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const input = screen.getByPlaceholderText(/enter url/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    await user.type(input, 'https://example.com');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com', { visualAnalysis: false, seoAnalysis: true });
    });
  });

  it('disables button when URL is empty', () => {
    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const button = screen.getByRole('button', { name: /analyze/i });
    expect(button).toBeDisabled();
    expect(mockOnAnalyze).not.toHaveBeenCalled();
  });

  it('shows validation error for invalid URL', async () => {
    const user = userEvent.setup();

    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const input = screen.getByPlaceholderText(/enter url/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    await user.type(input, 'not a valid url');
    await user.click(button);

    expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    expect(mockOnAnalyze).not.toHaveBeenCalled();
  });

  it('disables input and button when loading', () => {
    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={true} />
    );

    expect(screen.getByPlaceholderText(/enter url/i)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows loading text on button when loading', () => {
    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={true} />
    );

    expect(screen.getByRole('button')).toHaveTextContent(/analyzing/i);
  });

  it('enables button when URL is entered', async () => {
    const user = userEvent.setup();

    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const input = screen.getByPlaceholderText(/enter url/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    // Button should be disabled when empty
    expect(button).toBeDisabled();

    // Type a URL
    await user.type(input, 'https://example.com');

    // Button should now be enabled
    expect(button).not.toBeDisabled();
  });

  it('submits form on Enter key press', async () => {
    const user = userEvent.setup();
    mockOnAnalyze.mockResolvedValue(undefined);

    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const input = screen.getByPlaceholderText(/enter url/i);

    await user.type(input, 'https://example.com{enter}');

    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com', { visualAnalysis: false, seoAnalysis: true });
    });
  });

  it('trims whitespace from URL', async () => {
    const user = userEvent.setup();
    mockOnAnalyze.mockResolvedValue(undefined);

    render(
      <URLInput onAnalyze={mockOnAnalyze} loading={false} />
    );

    const input = screen.getByPlaceholderText(/enter url/i);
    const button = screen.getByRole('button', { name: /analyze/i });

    await user.type(input, '  https://example.com  ');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnAnalyze).toHaveBeenCalledWith('https://example.com', { visualAnalysis: false, seoAnalysis: true });
    });
  });

  it('accepts valid URL formats', async () => {
    const user = userEvent.setup();
    mockOnAnalyze.mockResolvedValue(undefined);

    const validUrls = [
      'https://example.com',
      'http://example.com',
      'example.com',
      'www.example.com',
      'https://example.com/path',
      'https://example.com/path?query=1',
    ];

    for (const url of validUrls) {
      mockOnAnalyze.mockClear();

      const { unmount } = render(
        <URLInput onAnalyze={mockOnAnalyze} loading={false} />
      );

      const input = screen.getByPlaceholderText(/enter url/i);
      const button = screen.getByRole('button', { name: /analyze/i });

      await user.clear(input);
      await user.type(input, url);
      await user.click(button);

      await waitFor(() => {
        expect(mockOnAnalyze).toHaveBeenCalled();
      });

      unmount();
    }
  });
});
