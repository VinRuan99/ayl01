import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Sun, Moon, Globe, Phone, X } from 'lucide-react';

export default function PublicLayout() {
  const { theme, toggleTheme, settings, languages, currentLanguage, setCurrentLanguage } = useStore();
  const [showContact, setShowContact] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2">
                {settings?.logo ? (
                  <img src={settings.logo || undefined} alt={settings.brandName} className="h-8 w-auto" />
                ) : (
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {settings?.brandName || 'Ayaland'}
                  </span>
                )}
              </Link>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative" ref={langRef}>
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Globe className="w-5 h-5" />
                  <span className="uppercase text-sm font-medium">{currentLanguage}</span>
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setCurrentLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${currentLanguage === lang.code ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {settings?.logo ? (
                  <img src={settings.logo || undefined} alt={settings.brandName} className="h-8 w-auto brightness-0 invert" />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {settings?.brandName || 'Ayaland'}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">
                Nhà phát triển bất động sản hàng đầu, kiến tạo không gian sống và giá trị đầu tư bền vững.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Hotline: {settings?.hotline}</li>
                <li>Zalo: {settings?.zalo}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Liên kết</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Trang chủ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} {settings?.brandName || 'Ayaland'}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      {showContact && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col items-end gap-3 md:gap-4 z-50">
          <button 
            onClick={() => setShowContact(false)}
            className="md:hidden bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700 transition-colors"
            aria-label="Đóng liên hệ"
          >
            <X className="w-4 h-4" />
          </button>
          <a
            href={`https://zalo.me/${settings?.zalo}`}
            target="_blank"
            rel="noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 bg-[#0068FF] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#0054cc] hover:scale-110 transition-all duration-300"
            title="Chat Zalo"
          >
            <span className="font-bold text-base md:text-lg tracking-wide">Zalo</span>
          </a>
          <a
            href={`tel:${settings?.hotline}`}
            className="w-12 h-12 md:w-14 md:h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition-all duration-300 animate-bounce-slow"
            title="Gọi ngay"
          >
            <Phone className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
          </a>
        </div>
      )}
    </div>
  );
}
