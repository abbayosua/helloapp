'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { UserAvatar } from '@/components/molecules/user-avatar';
import { 
  X, Users, Link, Shield, UserMinus, LogOut, 
  Check, Loader2, Copy, CheckCheck, Settings
} from 'lucide-react';
import type { Profile, Group } from '@/types/database';

interface GroupAdmin {
  user_id: string;
  role: 'admin' | 'super_admin';
  profile: Profile;
}

interface GroupParticipant extends Profile {
  is_admin: boolean;
  admin_role?: string;
}

interface GroupWithDetails extends Group {
  admins: GroupAdmin[];
  participants: GroupParticipant[];
  created_by_profile: Profile | null;
}

interface GroupInfoProps {
  groupId: string;
  currentUserId: string;
  onClose: () => void;
  onLeaveGroup?: () => void;
}

export function GroupInfo({
  groupId,
  currentUserId,
  onClose,
  onLeaveGroup,
}: GroupInfoProps) {
  const [group, setGroup] = useState<GroupWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroup(data.group);
        setEditName(data.group.name);
        setEditDescription(data.group.description || '');
      } else {
        setError('Failed to load group info');
      }
    } catch {
      setError('Failed to load group info');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const currentUserAdmin = group?.admins.find(a => a.user_id === currentUserId);
  const isSuperAdmin = currentUserAdmin?.role === 'super_admin';
  const isAdmin = !!currentUserAdmin;
  const isCreator = group?.created_by === currentUserId;

  const handleUpdateGroup = async () => {
    if (!editName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGroup(prev => prev ? { ...prev, ...data.group } : null);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update group');
      }
    } catch {
      setError('Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.invite_url);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate invite link');
      }
    } catch {
      setError('Failed to generate invite link');
    }
  };

  const handleCopyInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(`${window.location.origin}${inviteLink}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: 'admin' }),
      });

      if (response.ok) {
        fetchGroup();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to promote member');
      }
    } catch {
      setError('Failed to promote member');
    }
  };

  const handleDemoteAdmin = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/admins?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGroup();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to demote admin');
      }
    } catch {
      setError('Failed to demote admin');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/members?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchGroup();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove member');
      }
    } catch {
      setError('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onLeaveGroup?.();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to leave group');
      }
    } catch {
      setError('Failed to leave group');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#111B21] rounded-lg shadow-xl w-full max-w-md mx-4 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-[#111B21] rounded-lg shadow-xl w-full max-w-md mx-4 p-8">
          <p className="text-center text-destructive">{error || 'Group not found'}</p>
          <Button className="w-full mt-4" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#111B21] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">
            Group info
          </h2>
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Group avatar and name */}
          <div className="flex flex-col items-center py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3">
              {group.avatar_url ? (
                <img src={group.avatar_url} alt={group.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Users className="h-10 w-10 text-gray-400" />
              )}
            </div>

            {isEditing ? (
              <div className="w-full px-4 space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Group name"
                  maxLength={100}
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Group description"
                  maxLength={500}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(group.name);
                      setEditDescription(group.description || '');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleUpdateGroup}
                    disabled={isUpdating}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-gray-500 mt-1 text-center px-4">{group.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Created {new Date(group.created_at).toLocaleDateString()}
                </p>
              </>
            )}
          </div>

          {/* Invite link section (admin only) */}
          {isAdmin && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-foreground mb-2">Invite link</h4>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleGenerateInvite}
                  className="flex-1"
                >
                  <Link className="h-4 w-4 mr-2" />
                  Generate link
                </Button>
              </div>
              {inviteLink && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <code className="text-xs flex-1 truncate">{inviteLink}</code>
                  <Button variant="ghost" size="icon" onClick={handleCopyInvite}>
                    {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Members list */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-foreground mb-2">
              {group.participants.length} members
            </h4>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {group.participants.map((participant) => {
                const participantAdmin = group.admins.find(a => a.user_id === participant.id);
                const isCurrent = participant.id === currentUserId;
                const canPromote = isSuperAdmin && !participantAdmin && !isCurrent;
                const canDemote = isSuperAdmin && participantAdmin && !isCurrent && participant.id !== group.created_by;
                const canRemove = isAdmin && !isCurrent && participant.id !== group.created_by;

                return (
                  <li key={participant.id} className="py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={participant} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">
                            {participant.display_name || 'Unknown'}
                          </p>
                          {isCurrent && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                          {participant.id === group.created_by && (
                            <Shield className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {participantAdmin ? (
                            <span className="text-primary">
                              {participantAdmin.role === 'super_admin' ? 'Super admin' : 'Admin'}
                            </span>
                          ) : (
                            participant.phone || 'No phone'
                          )}
                        </p>
                      </div>
                      
                      {/* Actions */}
                      {(canPromote || canDemote || canRemove) && (
                        <div className="flex gap-1">
                          {canPromote && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handlePromoteAdmin(participant.id)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          {canDemote && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDemoteAdmin(participant.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {canRemove && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveMember(participant.id)}
                            >
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Leave group button */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLeaveGroup}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
