import { Link } from 'wouter';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export function Logo({ showText = true, className }: LogoProps) {
  return (
    <Link href="/">
      <div className={cn(
        "flex items-center space-x-2 cursor-pointer transition-colors duration-200",
        className
      )}>
        {/* Logo Icon - using Play icon as placeholder until logo-icon.svg is available */}
        <div className="w-8 h-8 bg-amber-700 dark:bg-amber-300 rounded-lg flex items-center justify-center flex-shrink-0">
          {/* 
          Future implementation with actual logo file:
          <img 
            src="/logo-icon.svg" 
            alt="Mosswood Logo" 
            className="w-6 h-6"
          />
          */}
          <Play className="text-white dark:text-gray-900 text-sm fill-current" />
        </div>
        
        {/* Logo Text */}
        {showText && (
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Mosswood
          </span>
        )}
      </div>
    </Link>
  );
}