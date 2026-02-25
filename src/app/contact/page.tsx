import { AppShell } from "@/components/app-shell";
import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <AppShell>
        <div className="w-full h-full flex items-center justify-center">
             <div className="w-full max-w-2xl">
                <ContactForm />
            </div>
        </div>
    </AppShell>
  );
}
