import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function EmailConfirmation() {
  const [, setLocation] = useLocation();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_confirmed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const type = urlParams.get('type');

        console.log('Email confirmation params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        // If this is an email confirmation
        if (type === 'signup' && accessToken && refreshToken) {
          // Set the session
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Email confirmation error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to confirm email');
            return;
          }

          if (data.user) {
            console.log('Email confirmed successfully for:', data.user.email);
            setStatus('success');
            setMessage('Your email has been confirmed successfully!');
            
            // Refresh the auth profile
            await refreshProfile();
            
            // Redirect to login after a short delay
            setTimeout(() => {
              setLocation('/login?confirmed=true');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Unable to confirm email. Please try again.');
          }
        } else {
          // Check if user is already signed in
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setStatus('already_confirmed');
            setMessage('Your email is already confirmed.');
          } else {
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email and try again.');
          }
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [refreshProfile, setLocation]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-md mx-auto px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              {status === 'loading' && (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Confirming Email...</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Email Confirmed!</span>
                </>
              )}
              {status === 'already_confirmed' && (
                <>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>Already Confirmed</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span>Confirmation Failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the login page shortly...
                </p>
                <Link href="/login?confirmed=true">
                  <Button className="w-full">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            )}
            
            {status === 'already_confirmed' && (
              <Link href="/login">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
            )}
            
            {status === 'error' && (
              <div className="space-y-2">
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Try Signing Up Again
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="w-full">
                    Already Have an Account? Sign In
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}