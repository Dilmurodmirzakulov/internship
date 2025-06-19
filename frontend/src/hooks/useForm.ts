import { useState, useCallback } from 'react';
import { useForm as useReactHookForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useUIStore } from '@/store/uiStore';

interface UseFormOptions {
  schema?: yup.ObjectSchema<any>;
  defaultValues?: any;
  onSubmit: (data: any) => Promise<void> | void;
  onError?: (error: any) => void;
}

export const useForm = ({
  schema,
  defaultValues,
  onSubmit,
  onError,
}: UseFormOptions) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addNotification = useUIStore(state => state.addNotification);

  const methods = useReactHookForm({
    resolver: schema ? yupResolver(schema) : undefined,
    defaultValues,
  });

  const handleSubmit = useCallback(
    async (data: any) => {
      setIsSubmitting(true);
      try {
        await onSubmit(data);
        addNotification({
          type: 'success',
          message: 'Form submitted successfully!',
          duration: 3000,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An error occurred';
        addNotification({
          type: 'error',
          message: errorMessage,
          duration: 5000,
        });
        onError?.(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onError, addNotification]
  );

  const setFieldError = useCallback(
    (name: string, message: string) => {
      methods.setError(name as any, { type: 'manual', message });
    },
    [methods]
  );

  const clearFieldError = useCallback(
    (name: string) => {
      methods.clearErrors(name as any);
    },
    [methods]
  );

  const resetForm = useCallback(() => {
    methods.reset();
  }, [methods]);

  return {
    ...methods,
    isSubmitting,
    handleSubmit: methods.handleSubmit(handleSubmit),
    setFieldError,
    clearFieldError,
    resetForm,
  };
};
