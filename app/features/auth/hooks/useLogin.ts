import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

interface UseLoginResult {
  email: string;
  password: string;
  errorMessage: string | null;
  isLoggingIn: boolean;
  isPasswordVisible: boolean;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => Promise<boolean>;
  togglePasswordVisibility: () => void;
}

export function useLogin(): UseLoginResult {
  const login = useAuthStore(state => state.login);
  const isLoggingIn = useAuthStore(state => state.isLoading);
  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const setEmail = (value: string) => {
    setEmailState(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const setPassword = (value: string) => {
    setPasswordState(value);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(currentValue => !currentValue);
  };

  const submit = async (): Promise<boolean> => {
    setErrorMessage(null);

    try {
      await login(email, password);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.');
      return false;
    }
  };

  return {
    email,
    password,
    errorMessage,
    isLoggingIn,
    isPasswordVisible,
    setEmail,
    setPassword,
    submit,
    togglePasswordVisibility,
  };
}
