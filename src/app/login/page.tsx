import { LoginForm } from "@/components/auth/login-form";
import { AppShell } from "@/components/app-shell";
import { AuthFormContainer } from "@/components/auth/auth-form-container";

export default function LoginPage() {
  return (
    <AppShell>
      <AuthFormContainer>
        <LoginForm />
      </AuthFormContainer>
    </AppShell>
  );
}
