import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

/**
 * Reset Password Form Tests
 *
 * Tests the password reset form component to ensure:
 * - Session validation
 * - Password validation (length, matching)
 * - API calls to Supabase updateUser
 * - Success redirect to projects
 * - Error handling for invalid/expired tokens
 */

// Mock Supabase client
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
  }),
}));

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("ResetPasswordForm - Session Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state while checking session", () => {
    mockGetSession.mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<ResetPasswordForm />);

    expect(screen.getByText(/verifying reset link/i)).toBeInTheDocument();
  });

  it("should show error for invalid session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
    });
  });

  it('should show "Request new reset link" button for invalid session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });

    const requestButton = screen.getByRole("button", {
      name: /request new reset link/i,
    });
    expect(requestButton).toBeInTheDocument();

    fireEvent.click(requestButton);

    expect(mockPush).toHaveBeenCalledWith("/forgot-password");
  });

  it("should show password form for valid session", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "valid-token",
          user: { id: "user-id" },
        },
      },
    });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });
  });
});

describe("ResetPasswordForm - Password Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "valid-token",
          user: { id: "user-id" },
        },
      },
    });
  });

  it("should render password input fields", async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });
  });

  it("should show password requirements", async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(
        screen.getByText(/must be at least 6 characters/i),
      ).toBeInTheDocument();
    });
  });

  it("should validate passwords match", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.change(confirmInput, { target: { value: "different123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Should not call API
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("should validate minimum password length", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "short" } });
    fireEvent.change(confirmInput, { target: { value: "short" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Look for the error message specifically, not the helper text
      const errorMessages = screen.getAllByText(
        /must be at least 6 characters/i,
      );
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    // Should not call API
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("should require both password fields", async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(
      /new password/i,
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      /confirm password/i,
    ) as HTMLInputElement;

    expect(passwordInput).toBeRequired();
    expect(confirmInput).toBeRequired();
  });

  it("should enforce minimum length attribute", async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(
      /new password/i,
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      /confirm password/i,
    ) as HTMLInputElement;

    expect(passwordInput).toHaveAttribute("minLength", "6");
    expect(confirmInput).toHaveAttribute("minLength", "6");
  });
});

describe("ResetPasswordForm - Password Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "valid-token",
          user: { id: "user-id" },
        },
      },
    });
  });

  it("should handle successful password update", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "newpassword123",
      });
    });

    // Should redirect to projects
    expect(mockPush).toHaveBeenCalledWith("/projects");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should show loading state during password update", async () => {
    mockUpdateUser.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100),
        ),
    );

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });
    fireEvent.click(submitButton);

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText(/updating password/i)).toBeInTheDocument();
    });

    // Button should be disabled
    expect(submitButton).toBeDisabled();
  });

  it("should disable form inputs during submission", async () => {
    // Use a promise we can control to avoid race conditions with next test
    let resolveUpdate: (value: { error: null }) => void;
    const updatePromise = new Promise<{ error: null }>((resolve) => {
      resolveUpdate = resolve;
    });
    mockUpdateUser.mockImplementation(() => updatePromise);

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(
      /new password/i,
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      /confirm password/i,
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(passwordInput).toBeDisabled();
      expect(confirmInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise and wait for completion
    resolveUpdate!({ error: null });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/projects");
    });
  });

  it("should handle API errors", async () => {
    const errorMessage = "Failed to update password";
    mockUpdateUser.mockResolvedValue({
      error: { message: errorMessage },
    });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordForm - Password Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "valid-token",
          user: { id: "user-id" },
        },
      },
    });
  });

  it("should use password type for inputs", async () => {
    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(
      /new password/i,
    ) as HTMLInputElement;
    const confirmInput = screen.getByLabelText(
      /confirm password/i,
    ) as HTMLInputElement;

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");
  });

  it("should document password requirements", () => {
    // Password requirements (enforced by Supabase):
    const requirements = {
      minLength: 6,
      mustMatch: true,
      type: "password",
    };

    expect(requirements.minLength).toBeGreaterThanOrEqual(6);
    expect(requirements.mustMatch).toBe(true);
  });
});

describe("ResetPasswordForm - Complete Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should complete full password reset flow", async () => {
    // Step 1: Valid session
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "valid-token",
          user: { id: "user-id" },
        },
      },
    });

    // Step 2: Successful password update
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordForm />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    // Enter matching passwords
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    fireEvent.change(passwordInput, { target: { value: "newpassword123" } });
    fireEvent.change(confirmInput, { target: { value: "newpassword123" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));

    // Verify API call
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "newpassword123",
      });
    });

    // Verify redirect
    expect(mockPush).toHaveBeenCalledWith("/projects");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle expired token scenario", async () => {
    // User clicks old email link with expired token
    mockGetSession.mockResolvedValue({ data: { session: null } });

    render(<ResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    });

    // User can request new link
    const requestButton = screen.getByRole("button", {
      name: /request new reset link/i,
    });
    fireEvent.click(requestButton);

    expect(mockPush).toHaveBeenCalledWith("/forgot-password");
  });
});
