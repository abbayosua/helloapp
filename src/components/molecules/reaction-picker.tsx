'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  className?: string;
  position?: 'top' | 'bottom';
}

export function ReactionPicker({
  onSelect,
  onClose,
  className,
  position = 'top',
}: ReactionPickerProps) {
  return (
    <div
      className={cn(
        'absolute z-50 flex gap-1 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700',
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        className
      )}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          className="text-xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => {
            onSelect(emoji);
            onClose?.();
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
