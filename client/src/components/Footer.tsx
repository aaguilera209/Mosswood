import { Play } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-6 h-6 bg-amber-700 dark:bg-amber-300 rounded-md flex items-center justify-center">
            <Play className="text-white dark:text-gray-900 text-xs fill-current" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Mosswood</span>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © 2024 Mosswood. Empowering creators worldwide.
        </p>
        
        <div className="flex justify-center space-x-6 mt-6">
          <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 text-sm">
            Privacy Policy
          </a>
          <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 text-sm">
            Terms of Service
          </a>
          <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors duration-200 text-sm">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
