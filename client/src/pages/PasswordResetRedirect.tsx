import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * This component handles the redirect from Supabase's password reset email
 * when the email is configured for a different port (like localhost:3000)
 * but our app runs on localhost:5000
 */
export default function PasswordResetRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get the current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // If there are URL parameters or hash, redirect to our reset password page
    if (urlParams.toString() || hash) {
      const newUrl = `/reset-password${window.location.search}${hash}`;
      console.log('Redirecting to:', newUrl);
      setLocation(newUrl);
    } else {
      // If no parameters, redirect to forgot password page
      setLocation('/forgot-password');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to password reset...</p>
      </div>
    </div>
  );
}