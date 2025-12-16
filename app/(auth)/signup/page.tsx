import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/ui/logo';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Logo size="lg" />
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">
            Start building better AI products
          </p>
        </div>
      </div>
      <SignupForm />
    </div>
  );
}
