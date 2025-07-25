import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Book, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';
import { useGroups, useGroupMembers } from '@/hooks/useGroups';
import GroupChatWindow from '@/components/social/GroupChatWindow';

const GroupDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: groups = [] } = useGroups();
  const { data: members = [] } = useGroupMembers(id || '');
  const [showChat, setShowChat] = useState(false);

  const group = groups.find(g => g.id === id);

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Group not found</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${group.name} | Reading Group`}
        description={group.description || 'Reading group details'}
        canonical={`https://sahadhyayi.com/groups/${group.id}`}
      />
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <Link to="/groups">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{group.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.description && <p>{group.description}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {group.member_count ?? members.length} members
              </span>
              {/* Commented out until these properties are added to the groups table
              {group.currentBook && (
                <span className="flex items-center gap-1">
                  <Book className="w-4 h-4" />
                  {group.currentBook}
                </span>
              )}
              {group.nextMeeting && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {group.nextMeeting}
                </span>
              )}
              {group.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {group.location}
                </span>
              )}
              */}
            </div>
            <Button onClick={() => setShowChat(true)} className="bg-orange-600 hover:bg-orange-700">
              Open Group Chat
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={member.user_profile?.profile_photo_url || ''} />
                  <AvatarFallback>
                    {member.user_profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{member.user_profile?.full_name || 'User'}</span>
              </div>
            ))}
            {members.length === 0 && <p>No members yet.</p>}
          </CardContent>
        </Card>
      </div>
      {showChat && (
        <GroupChatWindow groupId={group.id} isOpen={showChat} onClose={() => setShowChat(false)} />
      )}
    </>
  );
};

export default GroupDetails;
