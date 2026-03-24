'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { Search, X, Loader2, UserPlus } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  about: string | null;
}

interface NewChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewChatDialog({
  isOpen,
  onClose,
  onConversationCreated,
}: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      }
    } catch {
      setError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleStartConversation = async (userId: string) => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'direct',
          participant_ids: [userId],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onConversationCreated(data.conversation.id);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create conversation');
      }
    } catch {
      setError('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#111B21] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            New chat
          </h2>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or phone number"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : searchQuery.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">Search for users by name or phone</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <p className="text-sm">No users found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((user) => (
                <li key={user.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleStartConversation(user.id)}
                    disabled={isCreating}
                  >
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-foreground truncate">
                        {user.display_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.phone || 'No phone'}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
