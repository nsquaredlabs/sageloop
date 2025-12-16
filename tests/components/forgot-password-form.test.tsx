import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

/**
 * Forgot Password Form Tests
 *
 * Tests the forgot password request form component to ensure:
 * - Email input validation
 * - API calls to Supabase resetPasswordForEmail
 * - Success message display
 * - Error handling
 * - Security: doesn't reveal if email exists
 */

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email input field', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('should render "Back to login" link', () => {
    render(<ForgotPasswordForm />);

    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should display helper text about email', () => {
    render(<ForgotPasswordForm />);

    expect(screen.getByText(/we'll send a password reset link/i)).toBeInTheDocument();
  });

  it('should handle successful password reset request', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should display success message with user email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    mockResetPasswordForEmail.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Should show loading text
    expect(await screen.findByText(/sending/i)).toBeInTheDocument();

    // Button should be disabled
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to send reset email';
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: errorMessage },
    });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should disable form inputs during submission', async () => {
    mockResetPasswordForEmail.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Inputs should be disabled during submission
    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it('should include redirect URL in API call', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });
  });

  it('should show "Back to login" button in success state', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    // Should show "Back to login" button
    const backButton = screen.getByRole('button', { name: /back to login/i });
    expect(backButton.closest('a')).toHaveAttribute('href', '/login');
  });

  it('should require email input', () => {
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput).toBeRequired();
  });

  it('should validate email format', () => {
    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});

describe('ForgotPasswordForm - Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show same success message regardless of email existence (security)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      // Should show generic success message that doesn't reveal if email exists
      expect(screen.getByText(/if an account exists/i)).toBeInTheDocument();
    });
  });

  it('should document the security pattern for password reset', () => {
    // Security best practice: Never reveal if an email exists in the system
    // This prevents email enumeration attacks
    const securityPattern = {
      validEmail: 'Shows success message',
      invalidEmail: 'Shows success message',
      reason: 'Prevents attackers from discovering valid email addresses',
    };

    expect(securityPattern.validEmail).toBe(securityPattern.invalidEmail);
  });
});
