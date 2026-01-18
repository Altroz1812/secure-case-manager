import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse({ email });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    
    setIsLoading(false);
  };

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
      
      {/* Right side - Forgot Password form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4 flex h-12 w-12 mx-auto items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xl">
              RCU
            </div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              {success 
                ? "Check your email for reset instructions"
                : "Enter your email and we'll send you a reset link"
              }
            </CardDescription>
          </CardHeader>
          
          {success ? (
            <CardContent className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and click the link to reset your password.
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  onClick={() => setSuccess(false)} 
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
              </p>
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
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </CardFooter>
            </form>
          )}
          
          <div className="px-6 pb-6">
            <Link 
              to="/auth" 
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
