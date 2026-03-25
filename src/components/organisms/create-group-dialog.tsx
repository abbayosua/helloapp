'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { Search, X, Loader2, Users, Check } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  about: string | null;
}

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupDialog({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupDialogProps) {
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
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

  const toggleUserSelection = (user: Profile) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Select at least 2 members for the group');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_group: true,
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          participant_ids: selectedUsers.map(u => u.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onGroupCreated(data.conversation.id);
        handleClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create group');
      }
    } catch {
      setError('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setGroupName('');
    setGroupDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#111B21] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            New group
          </h2>
        </div>

        {step === 'select' ? (
          <>
            {/* Selected users chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
                {selectedUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
                  >
                    <span className="text-sm font-medium text-primary">
                      {user.display_name || 'User'}
                    </span>
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="text-primary hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
            <div className="max-h-[40vh] overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : searchQuery.trim() === '' ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mb-2 opacity-50" />
                  <p className="text-sm">Search for users to add to the group</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((user) => {
                    const isSelected = selectedUsers.some(u => u.id === user.id);
                    return (
                      <li key={user.id}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => toggleUserSelection(user)}
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
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Next button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                className="w-full"
                onClick={() => {
                  if (selectedUsers.length < 2) {
                    setError('Select at least 2 members');
                    return;
                  }
                  setError(null);
                  setStep('details');
                }}
                disabled={selectedUsers.length < 2}
              >
                Next ({selectedUsers.length} selected)
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Group details form */}
            <div className="p-4 space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div>
                <Input
                  type="text"
                  placeholder="Group description (optional)"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <p className="text-xs text-gray-500 text-center">
                Group will have {selectedUsers.length + 1} members (including you)
              </p>
            </div>

            {/* Create button */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                className="w-full"
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create group'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
