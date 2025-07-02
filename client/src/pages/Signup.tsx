import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Play } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement signup logic
    console.log('Signup attempt:', { email, username, password });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/">
            <div className="flex items-center justify-center space-x-2 cursor-pointer mb-6">
              <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                <Play className="text-white text-sm fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">Mosswood</span>
            </div>
          </Link>
          
          <div>
            <h1 className="text-2xl font-bold">Start Creating</h1>
            <p className="text-muted-foreground">Join the platform built for creators</p>
          </div>
        </div>

        {/* Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Take control of your creative journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full bg-accent-primary hover:bg-accent-hover">
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login">
              <span className="text-accent-primary hover:text-accent-hover cursor-pointer underline">
                Sign in
              </span>
            </Link>
          </p>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
