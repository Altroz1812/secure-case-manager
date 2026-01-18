import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // The reset password link creates a session, so we check for it
      if (session) {
        setIsValidSession(true);
      } else {
        // Also check URL hash for recovery token (Supabase sends it in URL)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
          // Set the session from the recovery token
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (!error) {
            setIsValidSession(true);
          } else {
            setIsValidSession(false);
            setError('Invalid or expired reset link. Please request a new one.');
          }
        } else {
          setIsValidSession(false);
          setError('Invalid or expired reset link. Please request a new one.');
        }
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      passwordSchema.parse({ password, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    
    if (error) {
      if (error.message.includes('same as')) {
        setError('New password must be different from your current password.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(true);
      // Sign out and redirect to login after a delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/auth', { replace: true });
      }, 3000);
    }
    
    setIsLoading(false);
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground font-bold text-3xl">
            RCU
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4">
            RCU Automation Platform
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Streamline your verification processes with our comprehensive Risk Containment Unit management system.
          </p>
        </div>
      </div>
      
      {/* Right side - Reset Password form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4 flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              RCU
            </div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {success ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <KeyRound className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {success ? 'Password Updated!' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {success 
                ? "Your password has been successfully updated"
                : "Enter your new password below"
              }
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Your password has been successfully reset. You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate('/auth', { replace: true })} 
                className="w-full"
              >
                Continue to Sign In
              </Button>
            </CardContent>
          ) : !isValidSession ? (
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => navigate('/forgot-password')} 
                className="w-full"
              >
                Request New Reset Link
              </Button>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
