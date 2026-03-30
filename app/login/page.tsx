'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  // Controlla se c'è già un refresh token valido
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Prova a validare il token corrente (se esiste nel cookie)
        const validateResponse = await fetch('/api/auth/validate', {
          method: 'POST',
          credentials: 'include', // Invia i cookie
        });

        if (validateResponse.ok) {
          // Token valido, vai alla dashboard
          router.push('/dashboard');
          return;
        }

        // Token non valido, prova a fare refresh
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          // Refresh riuscito, vai alla dashboard
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.log('Nessun token valido, mostra login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [router]);

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
    };
    let isValid = true;

    if (!formData.email.trim()) {
      errors.email = 'L\'email è obbligatoria';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Inserisci un indirizzo email valido';
      isValid = false;
    }

    if (!formData.password.trim()) {
      errors.password = 'La password è obbligatoria';
      isValid = false;
    } else if (formData.password.length < 3) {
      errors.password = 'La password è troppo corta';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante per ricevere i cookie
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // I token sono già salvati nei cookie HttpOnly dal server!
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: '',
      });
    }
  };

  // Mostra loading mentre controlla l'autenticazione
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding - Responsive: top on mobile, right side on desktop */}
      <div className="flex justify-center items-center py-12 lg:py-0 lg:flex-1 bg-white dark:bg-zinc-950 lg:bg-zinc-50 lg:dark:bg-zinc-900 lg:relative lg:overflow-hidden order-first lg:order-last">
        {/* Subtle Grid Pattern - Desktop only */}
        <div className="hidden lg:block absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(228 228 231 / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(228 228 231 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}></div>
        
        {/* Content */}
        <div className="relative z-10 text-center space-y-2 lg:space-y-3">
          <h1 className="text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white">
            ANH-here
          </h1>
          <p className="text-base lg:text-lg text-zinc-600 dark:text-zinc-400">
            Presence Management System
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 px-4 py-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            <div className="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full px-3 py-2.5 border rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    fieldErrors.email
                      ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                      : 'border-zinc-300 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100'
                  }`}
                  placeholder="name@company.com"
                />
                {fieldErrors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2.5 pr-10 border rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                      fieldErrors.password
                        ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                        : 'border-zinc-300 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-zinc-100'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-center">
              <a
                href="#"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
