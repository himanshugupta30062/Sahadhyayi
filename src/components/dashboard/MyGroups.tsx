import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Calendar } from 'lucide-react';
import { useUserGroups } from '@/hooks/useGroups';
import { Link } from 'react-router-dom';

const MyGroups = () => {
  const { data: userGroups = [], isLoading } = useUserGroups();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-amber-600" />
            My Reading Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading your groups...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Users className="w-5 h-5 mr-2 text-amber-600" />
          My Reading Groups ({userGroups.length})
        </CardTitle>
        <Link to="/groups">
          <Button size="sm" variant="outline">
            Browse All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {userGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
            <Link to="/groups">
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Find Groups
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {userGroups.slice(0, 3).map((membership: any) => (
              <div key={membership.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-900 mb-1">
                  {membership.groups?.name}
                </h4>
                {membership.groups?.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {membership.groups.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {new Date(membership.joined_at).toLocaleDateString()}
                  </div>
                  <Button size="sm" variant="ghost" className="text-amber-600">
                    View Group
                  </Button>
                </div>
              </div>
            ))}
            {userGroups.length > 3 && (
              <Link to="/groups">
                <Button variant="ghost" className="w-full">
                  View {userGroups.length - 3} more groups
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyGroups;