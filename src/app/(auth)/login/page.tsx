'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/templates/auth-layout';
import { LoginForm } from '@/components/organisms/login-form';
import { RegisterForm } from '@/components/organisms/register-form';

export default function LoginPage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);

  const handleSuccess = () => {
    router.push('/');
    router.refresh();
  };

  return (
    <AuthLayout>
      {showRegister ? (
        <RegisterForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      ) : (
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToRegister={() => setShowRegister(true)}
        />
      )}
    </AuthLayout>
  );
}
