import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import ellaRisesLogo from '@/assets/ella-rises-logo.png';
import authService from '@/services/auth';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();
  const { login: adminLogin } = useAdminAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupData, setSignupData] = useState({
    FirstName: '',
    LastName: '',
    Email: '',
    Password: '',
    ConfirmPassword: '',
    FieldOfInterest: 'Both' as 'Arts' | 'STEM' | 'Both',
    DateOfBirth: '',
    City: '',
    State: '',
    Zip: '',
    PhoneNumber: '',
    SchoolOrEmployer: '',
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, try admin login
      if (loginEmail === 'admin@ellarises.org' && loginPassword === 'admin123') {
        await adminLogin(loginEmail, loginPassword);
        toast({ title: 'Welcome, Admin!', description: 'You have successfully logged in.' });
        navigate('/admin', { replace: true });
        return;
      }

      // Otherwise, try participant login
      await login({ Email: loginEmail, Password: loginPassword });
      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Login failed',
        description: (error as Error).message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.Password !== signupData.ConfirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    if (signupData.Password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
const { ConfirmPassword, ...submitData } = signupData;
      await signup(submitData);
      toast({ title: 'Account created!', description: 'Welcome to Ella Rises!' });
      navigate('/', { replace: true });
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: (error as Error).message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword(forgotEmail);
      toast({
        title: 'Check your email',
        description: 'If an account exists, we sent password reset instructions.',
      });
      setActiveTab('login');
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Could not process request',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSignupField = (field: string, value: string) => {
    setSignupData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ella-warm-cream to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to main site */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to main site
        </Link>

        <Card className="shadow-xl">
        <CardHeader className="text-center">
            <img src={ellaRisesLogo} alt="Ella Rises" className="h-16 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to Ella Rises</CardTitle>
            <CardDescription>
              {activeTab === 'login' && 'Sign in as a participant or admin'}
              {activeTab === 'signup' && 'Create your participant account'}
              {activeTab === 'forgot' && 'Reset your password'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => setActiveTab('forgot')}
                  >
                    Forgot your password?
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={signupData.FirstName}
                        onChange={(e) => updateSignupField('FirstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={signupData.LastName}
                        onChange={(e) => updateSignupField('LastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupData.Email}
                      onChange={(e) => updateSignupField('Email', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={signupData.PhoneNumber}
                      onChange={(e) => updateSignupField('PhoneNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={signupData.DateOfBirth}
                      onChange={(e) => updateSignupField('DateOfBirth', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Field of Interest *</Label>
                    <RadioGroup
                      value={signupData.FieldOfInterest}
                      onValueChange={(v) => updateSignupField('FieldOfInterest', v)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Arts" id="arts" />
                        <Label htmlFor="arts" className="cursor-pointer">Arts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="STEM" id="stem" />
                        <Label htmlFor="stem" className="cursor-pointer">STEM</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Both" id="both" />
                        <Label htmlFor="both" className="cursor-pointer">Both</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={signupData.City}
                        onChange={(e) => updateSignupField('City', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={signupData.State}
                        onChange={(e) => updateSignupField('State', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">Zip *</Label>
                      <Input
                        id="zip"
                        value={signupData.Zip}
                        onChange={(e) => updateSignupField('Zip', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="school">School or Employer</Label>
                    <Input
                      id="school"
                      value={signupData.SchoolOrEmployer}
                      onChange={(e) => updateSignupField('SchoolOrEmployer', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password * (min 8 characters)</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        value={signupData.Password}
                        onChange={(e) => updateSignupField('Password', e.target.value)}
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={signupData.ConfirmPassword}
                        onChange={(e) => updateSignupField('ConfirmPassword', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>

              {/* FORGOT PASSWORD */}
              <TabsContent value="forgot">
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Send Reset Link
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={() => setActiveTab('login')}
                  >
                    Back to login
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
