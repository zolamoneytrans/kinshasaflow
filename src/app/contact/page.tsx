import { AppShell } from "@/components/app-shell";
import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto py-4">
          <ContactForm />
        </div>
      </div>
    </AppShell>
  );
}
