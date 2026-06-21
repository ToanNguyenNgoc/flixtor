import { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

interface UseRegisterResult {
  confirmPassword: string;
  displayName: string;
  email: string;
  errorMessage: string | null;
  isPasswordVisible: boolean;
  isRegistering: boolean;
  password: string;
  setConfirmPassword: (value: string) => void;
  setDisplayName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => Promise<boolean>;
  togglePasswordVisibility: () => void;
}

export function useRegister(): UseRegisterResult {
  const register = useAuthStore(state => state.register);
  const isRegistering = useAuthStore(state => state.isLoading);
  const [email, setEmailState] = useState('');
  const [displayName, setDisplayNameState] = useState('');
  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const setEmail = (value: string) => {
    setEmailState(value);
    clearError();
  };

  const setDisplayName = (value: string) => {
    setDisplayNameState(value);
    clearError();
  };

  const setPassword = (value: string) => {
    setPasswordState(value);
    clearError();
  };

  const setConfirmPassword = (value: string) => {
    setConfirmPasswordState(value);
    clearError();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(currentValue => !currentValue);
  };

  const submit = async (): Promise<boolean> => {
    setErrorMessage(null);

    const normalizedEmail = email.trim();
    const normalizedDisplayName = displayName.trim();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedEmail) {
      setErrorMessage('Vui lòng nhập email.');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setErrorMessage('Email không đúng định dạng.');
      return false;
    }

    if (!normalizedDisplayName) {
      setErrorMessage('Vui lòng nhập tên hiển thị.');
      return false;
    }

    if (!normalizedPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return false;
    }

    if (normalizedPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setErrorMessage('Xác nhận mật khẩu chưa khớp.');
      return false;
    }

    try {
      await register(normalizedEmail, password, normalizedDisplayName);
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Không thể đăng ký. Vui lòng thử lại.');
      return false;
    }
  };

  return {
    confirmPassword,
    displayName,
    email,
    errorMessage,
    isPasswordVisible,
    isRegistering,
    password,
    setConfirmPassword,
    setDisplayName,
    setEmail,
    setPassword,
    submit,
    togglePasswordVisibility,
  };
}
