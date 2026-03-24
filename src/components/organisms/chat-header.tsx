'use client';

import { UserAvatar } from '@/components/molecules/user-avatar';
import { Button } from '@/components/atoms/button';
import { OnlineIndicator } from '@/components/atoms/online-indicator';
import { MoreVertical, Phone, Video, Search, ArrowLeft } from 'lucide-react';

interface ChatHeaderProps {
  conversationId: string;
  name: string;
  avatar_url: string | null;
  status?: string;
  isGroup?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onMenu?: () => void;
}

export function ChatHeader({
  name,
  avatar_url,
  status,
  isGroup = false,
  onBack,
  onSearch,
  onCall,
  onVideoCall,
  onMenu,
}: ChatHeaderProps) {
  const getStatusText = () => {
    if (isGroup) return 'tap here for group info';
    if (status === 'online') return 'online';
    if (status === 'away') return 'away';
    return 'offline';
  };

  return (
    <div className="px-2 md:px-4 py-2 md:py-3 bg-[#F0F2F5] dark:bg-[#202C33] flex items-center justify-between border-b border-gray-200 dark:border-gray-700 min-h-[60px]">
      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
        {/* Back button for mobile */}
        {onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-gray-500 -ml-1"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <div className="relative flex-shrink-0">
          <UserAvatar 
            user={{ display_name: name, avatar_url }} 
            size="md" 
          />
          {!isGroup && status === 'online' && (
            <OnlineIndicator isOnline size="sm" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">
            {name}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {getStatusText()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hidden md:flex"
          onClick={onSearch}
          title="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hidden md:flex"
          onClick={onVideoCall}
          title="Video call"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hidden md:flex"
          onClick={onCall}
          title="Voice call"
        >
          <Phone className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500"
          onClick={onMenu}
          title="Menu"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
