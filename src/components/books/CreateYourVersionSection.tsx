import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import SignInLink from '@/components/SignInLink';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Edit3, Upload, ThumbsUp, User, Crown, Loader2, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface CreateYourVersionSectionProps {
  bookId: string;
  bookTitle: string;
}

type VersionType = 'summary' | 'alternate_ending' | 'chapter' | 'complete_rewrite';

interface VersionRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  content_type: string;
  is_published: boolean;
  created_at: string;
}

interface DisplayVersion {
  id: string;
  user_id: string;
  authorName: string;
  title: string;
  content: string;
  type: VersionType;
  isPublished: boolean;
  upvotes: number;
  isUpvoted: boolean;
  created_at: string;
}

const CreateYourVersionSection = ({ bookId, bookTitle }: CreateYourVersionSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [versionType, setVersionType] = useState<VersionType>('summary');
  const [isPublic, setIsPublic] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const queryKey = ['book_user_versions', bookId, user?.id];

  const { data: userVersions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<DisplayVersion[]> => {
      // Show all published versions for this book + the current user's own (incl. private).
      const { data: publicData, error: pubErr } = await supabase
        .from('user_generated_content')
        .select('id, user_id, title, content, content_type, is_published, created_at')
        .eq('book_id', bookId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(200);
      if (pubErr) throw pubErr;

      let mine: VersionRow[] = [];
      if (user) {
        const { data: myData, error: myErr } = await supabase
          .from('user_generated_content')
          .select('id, user_id, title, content, content_type, is_published, created_at')
          .eq('book_id', bookId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200);
        if (myErr) throw myErr;
        mine = (myData as VersionRow[]) || [];
      }

      const all = [...(publicData as VersionRow[] || []), ...mine];
      const dedup = Array.from(new Map(all.map((v) => [v.id, v])).values());

      if (dedup.length === 0) return [];

      const userIds = [...new Set(dedup.map((v) => v.user_id))];
      const ids = dedup.map((v) => v.id);

      const [profilesRes, votesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username').in('id', userIds),
        supabase.from('content_votes').select('content_id, user_id, vote_type').in('content_id', ids),
      ]);

      const profiles = profilesRes.data || [];
      const votes = votesRes.data || [];

      return dedup
        .map((v) => {
          const profile = profiles.find((p) => p.id === v.user_id);
          const rowVotes = votes.filter((vote) => vote.content_id === v.id);
          const upvotes = rowVotes.filter((vote) => vote.vote_type === 'upvote').length;
          const isUpvoted =
            !!user && rowVotes.some((vote) => vote.user_id === user.id && vote.vote_type === 'upvote');
          return {
            id: v.id,
            user_id: v.user_id,
            authorName: profile?.full_name || profile?.username || 'Author',
            title: v.title,
            content: v.content,
            type: (v.content_type as VersionType) || 'summary',
            isPublished: v.is_published,
            upvotes,
            isUpvoted,
            created_at: v.created_at,
          };
        })
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('user_generated_content').insert({
        user_id: user.id,
        book_id: bookId,
        title: title.trim(),
        content: content.trim(),
        content_type: versionType,
        is_published: isPublic,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      toast({
        title: isPublic ? 'Version published' : 'Saved privately',
        description: isPublic ? 'Your version is now visible to readers.' : 'Only you can see this.',
      });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not save version', description: err.message, variant: 'destructive' });
    },
  });

  const upvoteMutation = useMutation({
    mutationFn: async ({ versionId, isUpvoted }: { versionId: string; isUpvoted: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (isUpvoted) {
        const { error } = await supabase
          .from('content_votes')
          .delete()
          .eq('content_id', versionId)
          .eq('user_id', user.id)
          .eq('vote_type', 'upvote');
        if (error) throw error;
      } else {
        const { error } = await supabase.from('content_votes').insert({
          user_id: user.id,
          content_id: versionId,
          vote_type: 'upvote',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err: Error) => toast({ title: 'Vote failed', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_generated_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Version deleted' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  });

  const editMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_generated_content')
        .update({ title: editTitle.trim(), content: editContent.trim() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      toast({ title: 'Version updated' });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  });

  const startEdit = (v: DisplayVersion) => {
    setEditingId(v.id);
    setEditTitle(v.title);
    setEditContent(v.content);
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !user) return;
    submitMutation.mutate();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'summary': return 'bg-blue-100 text-blue-800';
      case 'alternate_ending': return 'bg-purple-100 text-purple-800';
      case 'chapter': return 'bg-green-100 text-green-800';
      case 'complete_rewrite': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'summary': return 'Summary';
      case 'alternate_ending': return 'Alt. Ending';
      case 'chapter': return 'New Chapter';
      case 'complete_rewrite': return 'Rewrite';
      default: return 'Other';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Edit3 className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl font-bold text-purple-900">Create Your Own Version</h3>
        </div>
        <p className="text-purple-700">Write your own version, summary, or alternate ending of "{bookTitle}"</p>
      </div>

      {/* Create New Version Form */}
      {user ? (
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-purple-900">Create Your Version</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="version-title">Title</Label>
              <Input
                id="version-title"
                placeholder="Give your version a title..."
                value={title}
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { value: 'summary', label: 'Summary' },
                { value: 'alternate_ending', label: 'Alt. Ending' },
                { value: 'chapter', label: 'New Chapter' },
                { value: 'complete_rewrite', label: 'Rewrite' },
              ].map((type) => (
                <Button
                  key={type.value}
                  variant={versionType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVersionType(type.value as VersionType)}
                  className={versionType === type.value ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  {type.label}
                </Button>
              ))}
            </div>

            <div>
              <Label htmlFor="version-content">Content</Label>
              <Textarea
                id="version-content"
                placeholder="Write your version here..."
                value={content}
                maxLength={20000}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="public-version" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="public-version">{isPublic ? 'Publish publicly' : 'Save as private'}</Label>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !content.trim() || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isPublic ? 'Publish Version' : 'Save Private'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Sign in to create and share your own versions</p>
            <Button variant="outline" asChild>
              <SignInLink>Sign In</SignInLink>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* User Versions List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Community Versions</h4>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p>Loading versions...</p>
          </div>
        ) : userVersions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No versions yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {userVersions.map((version) => (
              <Card
                key={version.id}
                className="bg-white/60 backdrop-blur-sm border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>
                              <User className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{version.authorName}</span>
                          {version.upvotes > 20 && <Crown className="w-4 h-4 text-yellow-500" />}
                          {!version.isPublished && (
                            <Badge variant="outline" className="text-xs">Private</Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h5 className="font-semibold text-lg text-gray-900 break-words">{version.title}</h5>
                      </div>
                      <Badge className={getTypeColor(version.type)}>{getTypeLabel(version.type)}</Badge>
                    </div>

                    {editingId === version.id ? (
                      <div className="space-y-2">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={150} />
                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} maxLength={20000} className="min-h-[150px]" />
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {version.content.length > 280
                          ? `${version.content.substring(0, 280)}...`
                          : version.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {user?.id === version.user_id && (
                          editingId === version.id ? (
                            <>
                              <Button variant="ghost" size="sm" disabled={editMutation.isPending || !editTitle.trim() || !editContent.trim()} onClick={() => editMutation.mutate(version.id)}>
                                <Check className="w-4 h-4 mr-1" /> Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4 mr-1" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => startEdit(version)} className="text-gray-500">
                                <Pencil className="w-4 h-4 mr-1" /> Edit
                              </Button>
                              <Button variant="ghost" size="sm" disabled={deleteMutation.isPending} onClick={() => { if (confirm('Delete this version?')) deleteMutation.mutate(version.id); }} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                              </Button>
                            </>
                          )
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!user || upvoteMutation.isPending}
                        onClick={() =>
                          upvoteMutation.mutate({ versionId: version.id, isUpvoted: version.isUpvoted })
                        }
                        className={`${version.isUpvoted ? 'text-purple-600' : 'text-gray-500'}`}
                      >
                        <ThumbsUp className={`w-4 h-4 mr-1 ${version.isUpvoted ? 'fill-current' : ''}`} />
                        {version.upvotes}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateYourVersionSection;
