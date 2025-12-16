import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Logo } from '@/components/ui/logo';

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Logo size="lg" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Set new password</h1>
          <p className="text-muted-foreground mt-2">
            Choose a strong password for your account
          </p>
        </div>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
