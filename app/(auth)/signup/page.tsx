import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="text-muted-foreground mt-2">
          Start building better AI products
        </p>
      </div>
      <SignupForm />
    </div>
  );
}
