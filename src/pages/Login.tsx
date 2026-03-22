import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { loginWithGoogle } from '../lib/firebase';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { user, settings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async () => {
    try {
      console.log('🔐 Starting Google Sign-in...');
      await loginWithGoogle();
      console.log('✅ Login successful');
    } catch (error) {
      console.error('❌ Login failed:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error code:', (error as any).code);
        alert(`Đăng nhập thất bại: ${error.message}`);
      } else {
        alert('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div>
          {settings?.logo ? (
            <img className="mx-auto h-16 w-auto" src={settings.logo || undefined} alt={settings.brandName} />
          ) : (
            <h2 className="text-center text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {settings?.brandName || 'Ayaland'}
            </h2>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Đăng nhập quản trị
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sử dụng tài khoản Google để tiếp tục
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <button
            onClick={handleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" aria-hidden="true" />
            </span>
            Đăng nhập với Google
          </button>
        </div>
      </div>
    </div>
  );
}
