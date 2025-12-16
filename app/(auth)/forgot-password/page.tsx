import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { Logo } from '@/components/ui/logo';

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Logo size="lg" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground mt-2">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
