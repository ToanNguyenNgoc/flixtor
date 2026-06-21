import { useState } from 'react';
import AuthService, { getAuthErrorMessage } from '@/features/auth/services/authService';

interface UseForgotPasswordResult {
  email: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  successMessage: string | null;
  setEmail: (value: string) => void;
  submit: () => Promise<boolean>;
}

export function useForgotPassword(): UseForgotPasswordResult {
  const [email, setEmailState] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setEmail = (value: string) => {
    setEmailState(value);

    if (errorMessage) {
      setErrorMessage(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const submit = async (): Promise<boolean> => {
    const normalizedEmail = email.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!normalizedEmail) {
      setErrorMessage('Vui lòng nhập email.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrorMessage('Email không đúng định dạng.');
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await AuthService.forgotPassword({
        email: normalizedEmail,
        platform: 'MOBA',
      });

      setSuccessMessage(response.msg);
      return true;
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    errorMessage,
    isSubmitting,
    successMessage,
    setEmail,
    submit,
  };
}
