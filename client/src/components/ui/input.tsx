import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow standard text editing shortcuts to work properly
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      
      // Don't prevent default for text editing shortcuts
      const textEditingShortcuts = [
        'KeyA', 'KeyC', 'KeyV', 'KeyX', 'KeyZ', 'KeyY', // Basic editing
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', // Navigation
        'Home', 'End', 'Backspace', 'Delete' // Movement/deletion
      ];
      
      if (cmdOrCtrl && textEditingShortcuts.includes(e.code)) {
        // Let the browser handle these shortcuts naturally
      }
      
      // Call original onKeyDown if provided
      onKeyDown?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary focus:shadow-sm focus:shadow-primary/20 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        onKeyDown={handleKeyDown}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
