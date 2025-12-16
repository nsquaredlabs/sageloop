import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Logo size="lg" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your Sageloop account
          </p>
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
