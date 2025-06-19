# React Sneat - Enhanced Admin Template

<p align="center">
   <a href="https://react-sneat-bootstrap-admin-template.vercel.app/" target="_blank">
      <img style="margin-right:20px" src="https://user-images.githubusercontent.com/749684/150333149-805037bc-8874-4a1f-876a-61a9683f8ef5.png" alt="sneat-logo" width="30px" height="auto">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1280px-React-icon.svg.png" alt="React Logo" height="45px">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Vitejs-logo.svg/615px-Vitejs-logo.svg.png" alt="Vite Logo" height="45px">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/TypeScript_Logo.svg/1200px-TypeScript_Logo.svg.png" alt="TypeScript Logo" height="45px">
   </a>
</p>

<h1 align="center">
   <a href="https://react-sneat-bootstrap-admin-template.vercel.app/" target="_blank" align="center">
      React Sneat - Enhanced Bootstrap 5 Admin Template
   </a>
</h1>

[![Sneat - Bootstrap 5 HTML Admin Template Demo Screenshot](https://github.com/themeselection/ts-assets/blob/main/sneat/sneat-bootstrap-html-admin-template-free/marketing/sneat-hrml-free-banner-github.png)](https://themeselection.com/item/sneat-free-bootstrap-html-admin-template/)

🚀 This project is an enhanced conversion of the Sneat Admin Template to React JS with TypeScript, providing a modern, type-safe, and feature-rich user interface for building powerful web applications.

## ✨ Enhanced Features

### 🛠️ **Modern Development Stack**
- **React 18** with functional components and hooks
- **TypeScript** for type safety and better developer experience
- **Vite** for lightning-fast development and building
- **React Router v6** for navigation
- **Bootstrap 5** for responsive design

### 🎯 **State Management & Forms**
- **Zustand** for lightweight state management
- **React Hook Form** with Yup validation
- **Persistent state** with localStorage
- **Form validation** with comprehensive error handling

### 🧪 **Testing & Quality**
- **Jest** with React Testing Library
- **ESLint** with TypeScript support
- **Prettier** for consistent code formatting
- **Husky** with pre-commit hooks
- **Lint-staged** for staged file processing

### 📚 **Documentation & Development**
- **Storybook** for component documentation
- **Bundle analyzer** for performance monitoring
- **Error boundaries** for graceful error handling
- **Loading states** and notifications system

### 🎨 **UI/UX Enhancements**
- **Theme switching** (light/dark mode)
- **Notification system** with toast messages
- **Protected routes** with role-based access
- **Responsive sidebar** with collapse functionality
- **Loading spinners** and error states

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/react-sneat-enhanced.git
   cd react-sneat-enhanced
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── atoms/          # Basic components (Button, Alert, etc.)
│   ├── molecules/      # Composite components
│   ├── organisms/      # Complex components
│   └── __tests__/      # Component tests
├── pages/              # Page components
├── layouts/            # Layout components
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── router/             # Routing configuration
└── assets/             # Static assets
```

## 🛠️ Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run type-check       # Run TypeScript type checking
```

### Testing
```bash
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
```

### Documentation
```bash
npm run storybook        # Start Storybook
npm run build-storybook  # Build Storybook
```

### Analysis
```bash
npm run analyze          # Analyze bundle size
```

## 🎨 Component Library

### Atoms
- **Button** - Configurable button component with multiple variants
- **Alert** - Notification alerts with different types
- **Badge** - Status and label badges
- **LoadingSpinner** - Loading indicators

### Molecules
- **NotificationToast** - Toast notification component
- **ProtectedRoute** - Route protection with authentication

### Organisms
- **ErrorBoundary** - Error handling wrapper
- **NotificationContainer** - Notification management

## 🔐 Authentication & Authorization

The app includes a complete authentication system:

```typescript
// Using the auth store
import { useAuthStore } from '@/store/authStore';

const { login, logout, user, isAuthenticated } = useAuthStore();
```

### Protected Routes
```typescript
<ProtectedRoute requireAuth roles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

## 📝 Form Handling

Enhanced form handling with validation:

```typescript
import { useForm } from '@/hooks/useForm';
import { loginSchema } from '@/utils/validation';

const { register, handleSubmit, errors, isSubmitting } = useForm({
  schema: loginSchema,
  onSubmit: async (data) => {
    // Handle form submission
  }
});
```

## 🎯 State Management

### Auth Store
- User authentication state
- Login/logout functionality
- Persistent user sessions

### UI Store
- Theme management
- Sidebar state
- Notification system
- Loading states

## 🧪 Testing

### Component Testing
```typescript
import { render, screen } from '@testing-library/react';
import Button from '@/components/atoms/Button';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

## 📚 Storybook

Component documentation and development:

```bash
npm run storybook         # Start Storybook
npm run build-storybook   # Build static site
```

Visit `http://localhost:6006` to view component documentation.

## 🎨 Theming

The app supports theme switching:

```typescript
import { useUIStore } from '@/store/uiStore';

const { theme, toggleTheme } = useUIStore();
```

## 📦 Bundle Optimization

The build is optimized with:
- **Code splitting** for routes
- **Tree shaking** for unused code
- **Bundle analysis** for performance monitoring
- **Manual chunks** for vendor libraries

## 🔧 Configuration Files

- **TypeScript**: `tsconfig.json` with strict settings
- **ESLint**: `.eslintrc.cjs` with TypeScript support
- **Prettier**: `.prettierrc` for code formatting
- **Jest**: `jest.config.js` for testing
- **Vite**: `vite.config.ts` with path aliases
- **Husky**: Pre-commit hooks configuration

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Bundle Analysis
```bash
npm run analyze
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new components
- Use Prettier for code formatting
- Follow ESLint rules
- Add Storybook stories for new components

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Original Sneat template by ThemeSelection
- React community for excellent tooling
- Contributors and maintainers

---

**Happy coding! 🎉**

For questions and support, please open an issue on GitHub.
