'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/button';
import { FormField } from '@/components/molecules/form-field';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          display_name: formData.display_name,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Auto login after registration
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (loginResponse.ok) {
        onSuccess?.();
        router.push('/');
        router.refresh();
      } else {
        // Redirect to login if auto-login fails
        router.push('/login');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold text-center text-foreground">
        Create account
      </h2>
      <p className="text-center text-muted-foreground mb-6">
        Join HelloApp and start messaging
      </p>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      <FormField
        label="Display Name"
        name="display_name"
        type="text"
        placeholder="Your name"
        value={formData.display_name}
        onChange={handleChange}
        required
        icon={<User className="h-4 w-4" />}
      />

      <FormField
        label="Phone (optional)"
        name="phone"
        type="tel"
        placeholder="+1 234 567 8900"
        value={formData.phone}
        onChange={handleChange}
        icon={<Phone className="h-4 w-4" />}
      />

      <FormField
        label="Email"
        name="email"
        type="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        required
        icon={<Mail className="h-4 w-4" />}
      />

      <FormField
        label="Password"
        name="password"
        type="password"
        placeholder="Create a password"
        value={formData.password}
        onChange={handleChange}
        required
        icon={<Lock className="h-4 w-4" />}
      />

      <FormField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        icon={<Lock className="h-4 w-4" />}
      />

      <Button
        type="submit"
        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#25D366] hover:underline font-medium"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
