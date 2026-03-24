'use client';

import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/templates/auth-layout';
import { RegisterForm } from '@/components/organisms/register-form';
import { useState } from 'react';
import { LoginForm } from '@/components/organisms/login-form';

export default function RegisterPage() {
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const handleSuccess = () => {
    router.push('/');
    router.refresh();
  };

  return (
    <AuthLayout>
      {showLogin ? (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      ) : (
        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </AuthLayout>
  );
}
