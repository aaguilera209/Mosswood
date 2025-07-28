import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

export default function ManualPasswordReset() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const currentUrl = window.location.origin;
  const correctResetUrl = `${currentUrl}/reset-password`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The URL has been copied to your clipboard.",
    });
  };

  const generateManualLink = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    // This is a workaround URL that the user can use
    const manualUrl = `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/users?search=${encodeURIComponent(email)}`;
    
    toast({
      title: "Manual reset instructions",
      description: "Check the instructions below to manually reset your password via Supabase Dashboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Logo showText={true} className="justify-center mb-6" />
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Password Reset Workaround</h1>
            <p className="text-muted-foreground">Due to URL configuration issues, here's how to reset your password</p>
          </div>
        </div>

        {/* Manual Reset Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Issue Detected</CardTitle>
            <CardDescription>
              Your Supabase project is configured to redirect to localhost:3000, but this app runs on {currentUrl}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Quick Fix Required</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                To fix password reset emails permanently, update your Supabase project settings:
              </p>
              <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
                <li>Go to your Supabase Dashboard → Authentication → URL Configuration</li>
                <li>Change Site URL from <code>http://localhost:3000</code> to <code>{currentUrl}</code></li>
                <li>Add <code>{correctResetUrl}</code> to Redirect URLs</li>
                <li>Save the changes</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="correct-url">Correct Reset URL (copy this to Supabase):</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="correct-url"
                    value={correctResetUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(correctResetUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="site-url">Current Site URL (copy this to Supabase):</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="site-url"
                    value={currentUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(currentUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Supabase Dashboard
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/forgot-password')}
              >
                Try Password Reset Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alternative: Manual Password Update */}
        <Card>
          <CardHeader>
            <CardTitle>Alternative: Manual Password Update</CardTitle>
            <CardDescription>
              If you have access to your Supabase dashboard, you can manually update your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your email address:</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Manual Steps:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to your Supabase Dashboard → Authentication → Users</li>
                <li>Search for your email: {email}</li>
                <li>Click on your user row</li>
                <li>Click "Reset Password" to send a new email</li>
                <li>Or manually set a new password in the dashboard</li>
              </ol>
            </div>
            
            <Button
              onClick={() => window.open(`https://supabase.com/dashboard`, '_blank')}
              variant="secondary"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Supabase Dashboard
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