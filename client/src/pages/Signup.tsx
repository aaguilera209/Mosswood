import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password);
      setEmailSent(true);
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link. Click it to complete your signup.",
        duration: 8000,
      });
      // Clear form
      setEmail('');
      setPassword('');
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "An error occurred during signup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo showText={true} className="justify-center mb-6" />
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Join Mosswood</h1>
            <p className="text-muted-foreground">Discover amazing content from independent creators</p>
          </div>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>{emailSent ? "Check your email!" : "Create your account"}</CardTitle>
            <CardDescription>
              {emailSent 
                ? "We've sent you a confirmation link. Click it to activate your account." 
                : "Start exploring and supporting creators"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4 py-6">
                <div className="text-6xl">📧</div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Check your email and click the confirmation link to complete your signup.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't see the email? Check your spam folder or try signing up again.
                  </p>
                </div>
                <div className="space-y-2">
                  <Link href="/login">
                    <Button className="w-full">
                      Go to Sign In
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setEmailSent(false)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
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
