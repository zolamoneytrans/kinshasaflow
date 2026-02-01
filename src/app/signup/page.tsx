import { SignupForm } from "@/components/auth/signup-form";
import { AppShell } from "@/components/app-shell";
import { AuthFormContainer } from "@/components/auth/auth-form-container";

export default function SignupPage() {
  return (
    <AppShell>
        <AuthFormContainer>
            <SignupForm />
        </AuthFormContainer>
    </AppShell>
  );
}
