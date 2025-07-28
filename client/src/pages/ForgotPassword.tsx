import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast({
        title: "Reset email sent!",
        description: "Check your email for a password reset link.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending reset email",
        description: error.message || "Please check if your email is registered with us.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <Logo showText={true} className="justify-center mb-6" />
            
            <div>
              <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
              <p className="text-muted-foreground">We've sent a password reset link to your email</p>
            </div>
          </div>

          {/* Success Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Email sent successfully</CardTitle>
              <CardDescription>
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Click the link in your email to reset your password</p>
                <p>• The link will expire in 24 hours for security</p>
                <p>• Check your spam folder if you don't see the email</p>
              </div>
              
              <Button 
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Send another email
              </Button>
            </CardContent>
          </Card>

          {/* Links */}
          <div className="text-center space-y-4">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo showText={true} className="justify-center mb-6" />
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
            <p className="text-muted-foreground">Enter your email and we'll send you a reset link</p>
          </div>
        </div>

        {/* Reset Form */}
        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              No worries! Enter your email address and we'll send you a link to reset it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                disabled={loading}
              >
                {loading ? 'Sending reset email...' : 'Send reset email'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Remember your password?{' '}
            <Link href="/login">
              <span className="text-primary hover:text-primary/80 cursor-pointer underline">
                Sign in
              </span>
            </Link>
          </p>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}