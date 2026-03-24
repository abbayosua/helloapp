'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/atoms/button';

interface ReplyPreviewProps {
  content: string;
  senderName: string;
  onClose: () => void;
  className?: string;
}

export function ReplyPreview({
  content,
  senderName,
  onClose,
  className,
}: ReplyPreviewProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-l-2 border-[#25D366] rounded-r-lg mb-2',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#25D366] truncate">
          {senderName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
