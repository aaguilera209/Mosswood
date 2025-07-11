import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { Link } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'creator' | 'user';
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Logo showText={true} className="justify-center mb-6" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Authentication Required</h1>
              <p className="text-muted-foreground">Please sign in to access this page</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                You need to be signed in to access this content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/login">
                <Button className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (requireRole && profile?.role !== requireRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <Logo showText={true} className="justify-center mb-6" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="text-muted-foreground">
                This page requires {requireRole} privileges
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Insufficient Permissions</CardTitle>
              <CardDescription>
                Your account doesn't have the required permissions to access this content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="w-full">
                  Go Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}