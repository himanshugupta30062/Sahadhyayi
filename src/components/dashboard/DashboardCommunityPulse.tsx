import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, MessageSquare, ChevronRight, BookOpen, Activity } from 'lucide-react';
import { useReadingRooms } from '@/hooks/useReadingRoom';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { useCommunityStats } from '@/hooks/useCommunityStats';

const DashboardCommunityPulse: React.FC = () => {
  const { data: rooms = [], isLoading: roomsLoading } = useReadingRooms();
  const { data: joinedGroups = [] } = useUserJoinedGroups();
  const { stats } = useCommunityStats();

  const activeRooms = rooms.slice(0, 3);

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle as="h2" className="text-base font-semibold flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            Community Pulse
          </CardTitle>
          {stats.totalSignups > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] h-5 px-1.5 font-medium gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <Users className="w-2.5 h-2.5" />
              {stats.totalSignups.toLocaleString()} Readers
            </Badge>
          )}
        </div>
        <Link to="/social">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">
            Open Feed <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active Live Rooms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              Live Reading Rooms
            </span>
            <span>{rooms.length} Active</span>
          </div>

          {roomsLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-14 rounded-lg bg-muted" />
              <div className="h-14 rounded-lg bg-muted" />
            </div>
          ) : activeRooms.length > 0 ? (
            <div className="space-y-2">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-10 rounded bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {room.books_library?.cover_image_url ? (
                        <img
                          src={room.books_library.cover_image_url}
                          alt={room.books_library?.title || 'Book cover'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {room.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {room.books_library?.title || 'General Reading'}
                      </p>
                    </div>
                  </div>

                  <Link to={`/social?tab=rooms&roomId=${room.id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Join
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-border text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                No active live rooms at this moment.
              </p>
              <Link to="/social?tab=rooms">
                <Button size="sm" variant="outline" className="text-xs h-7">
                  Start a Room
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Hub Links */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
          <Link
            to="/groups"
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted transition-colors text-xs text-foreground font-medium"
          >
            <Users className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
            <div className="truncate">
              <div>Groups</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                {joinedGroups.length > 0 ? `${joinedGroups.length} Joined` : 'Explore'}
              </div>
            </div>
          </Link>

          <Link
            to="/social"
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted transition-colors text-xs text-foreground font-medium"
          >
            <MessageSquare className="w-4 h-4 text-[hsl(var(--brand-secondary))]" />
            <div className="truncate">
              <div>Book Hubs</div>
              <div className="text-[10px] text-muted-foreground font-normal">
                Discussions
              </div>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardCommunityPulse;

