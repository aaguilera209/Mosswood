import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onKeyDown, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus:border-primary focus:shadow-sm focus:shadow-primary/20 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-y",
        className
      )}
      onKeyDown={handleKeyDown}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
