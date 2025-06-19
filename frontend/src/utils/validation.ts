import * as yup from 'yup';

// Common validation schemas
export const emailSchema = yup
  .string()
  .email('Please enter a valid email address')
  .required('Email is required');

export const passwordSchema = yup
  .string()
  .min(8, 'Password must be at least 8 characters')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .matches(/[0-9]/, 'Password must contain at least one number')
  .required('Password is required');

export const confirmPasswordSchema = yup
  .string()
  .oneOf([yup.ref('password')], 'Passwords must match')
  .required('Please confirm your password');

export const nameSchema = yup
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .required('Name is required');

// Login form validation
export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

// Registration form validation
export const registerSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
});

// Forgot password form validation
export const forgotPasswordSchema = yup.object({
  email: emailSchema,
});

// Profile update validation
export const profileSchema = yup.object({
  name: nameSchema,
  email: emailSchema,
  currentPassword: yup.string().when(['newPassword'], {
    is: (newPassword: string) => newPassword && newPassword.length > 0,
    then: () => yup.string().required('Current password is required'),
  }),
  newPassword: yup.string().min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: yup.string().when(['newPassword'], {
    is: (newPassword: string) => newPassword && newPassword.length > 0,
    then: () => confirmPasswordSchema,
  }),
});

// Generic form field validation
export const createFieldSchema = (type: string, required = false) => {
  let schema: yup.StringSchema | yup.NumberSchema;

  switch (type) {
    case 'email':
      schema = emailSchema;
      break;
    case 'password':
      schema = passwordSchema;
      break;
    case 'name':
      schema = nameSchema;
      break;
    case 'number':
      schema = yup.number().typeError('Must be a number');
      break;
    case 'url':
      schema = yup.string().url('Must be a valid URL');
      break;
    case 'phone':
      schema = yup
        .string()
        .matches(/^\+?[\d\s-()]+$/, 'Must be a valid phone number');
      break;
    default:
      schema = yup.string();
  }

  return required ? schema.required('This field is required') : schema;
};

// Validation helper function
export const validateField = async (
  schema: yup.Schema,
  value: any
): Promise<string | null> => {
  try {
    await schema.validate(value);
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Validation failed';
  }
};
