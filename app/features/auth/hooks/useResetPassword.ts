import { useMemo, useState } from 'react';
import AuthService, { getAuthErrorMessage } from '@/features/auth/services/authService';

interface UseResetPasswordResult {
  confirmPassword: string;
  errorMessage: string | null;
  hasValidToken: boolean;
  invalidTokenMessage: string | null;
  isPasswordVisible: boolean;
  isSubmitting: boolean;
  password: string;
  successMessage: string | null;
  setConfirmPassword: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => Promise<boolean>;
  togglePasswordVisibility: () => void;
}

export function useResetPassword(token?: string): UseResetPasswordResult {
  const normalizedToken = useMemo(() => token?.trim() ?? '', [token]);
  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasValidToken = normalizedToken.length > 0;
  const invalidTokenMessage = hasValidToken ? null : 'Link đặt lại mật khẩu không hợp lệ.';

  const clearMessages = () => {
    if (errorMessage) {
      setErrorMessage(null);
    }

    if (successMessage) {
      setSuccessMessage(null);
    }
  };

  const setPassword = (value: string) => {
    setPasswordState(value);
    clearMessages();
  };

  const setConfirmPassword = (value: string) => {
    setConfirmPasswordState(value);
    clearMessages();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(currentValue => !currentValue);
  };

  const submit = async (): Promise<boolean> => {
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasValidToken) {
      setErrorMessage('Link đặt lại mật khẩu không hợp lệ.');
      return false;
    }

    if (!normalizedPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu mới.');
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

    setIsSubmitting(true);

    try {
      const response = await AuthService.resetPassword({
        token: normalizedToken,
        password,
      });

      setPasswordState('');
      setConfirmPasswordState('');
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
    confirmPassword,
    errorMessage,
    hasValidToken,
    invalidTokenMessage,
    isPasswordVisible,
    isSubmitting,
    password,
    successMessage,
    setConfirmPassword,
    setPassword,
    submit,
    togglePasswordVisibility,
  };
}
