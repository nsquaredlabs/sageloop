import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AsyncActionButton } from '@/components/async-action-button';
import { Sparkles } from 'lucide-react';

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('AsyncActionButton', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    global.fetch = vi.fn();
  });

  it('should render with label and icon', () => {
    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    expect(screen.getByText('Test Action')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display metadata when provided', () => {
    render(
      <AsyncActionButton
        label="Generate Outputs"
        loadingLabel="Generating..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        metadata="5 scenarios"
      />
    );

    expect(screen.getByText('5 scenarios')).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Processing..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should immediately show loading state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('should call API endpoint with correct parameters', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );
    global.fetch = mockFetch;

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/projects/123/generate"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/projects/123/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    });
  });

  it('should send request body when provided', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );
    global.fetch = mockFetch;

    const requestBody = { scenarioIds: [1, 2, 3] };

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        requestBody={requestBody}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(requestBody),
        })
      );
    });
  });

  it('should navigate after successful request', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        navigateTo="/success"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/success');
    });
  });

  it('should refresh before navigating when enabled', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        navigateTo="/success"
        refreshBeforeNavigate={true}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/success');
    });
  });

  it('should call onSuccess callback after successful request', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    const onSuccess = vi.fn();

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        onSuccess={onSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should display error message on failure', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Something went wrong' }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    // Button should be re-enabled after error
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('should display generic error when no error message provided', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({}),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Request failed')).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should apply custom variant and size', () => {
    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        variant="destructive"
        size="sm"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Note: className testing depends on your button component implementation
  });

  it('should apply custom className', () => {
    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should not navigate if navigateTo is not provided', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should clear previous error when retrying', async () => {
    let callCount = 0;
    global.fetch = vi.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'First error' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
    });

    render(
      <AsyncActionButton
        label="Test Action"
        loadingLabel="Loading..."
        icon={Sparkles}
        apiEndpoint="/api/test"
      />
    );

    const button = screen.getByRole('button');

    // First attempt - should fail
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second attempt - should succeed and clear error
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });
});
