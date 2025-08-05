import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-6">
          <Logo showText={false} className="justify-center" />
        </div>
        <p className="text-muted-foreground text-sm">
          © 2025 Mosswood. Empowering creators worldwide.
        </p>
        
        <div className="flex justify-center space-x-6 mt-6">
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
            Privacy Policy
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
            Terms of Service
          </a>
          <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
