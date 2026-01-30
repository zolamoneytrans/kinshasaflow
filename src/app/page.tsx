import IDGenerator from "@/components/id-generator";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">
          IDGenius
        </h1>
        <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
          Create professional, secure ID cards in minutes. Choose a template, enter your details, and generate your ID with a verifiable QR code.
        </p>
      </div>
      <IDGenerator />
    </main>
  );
}
