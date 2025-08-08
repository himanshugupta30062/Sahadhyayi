import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { AuthorEvent } from '@/hooks/useAuthorEvents';
import { useEventAttendance } from '@/hooks/useAuthorEvents';
import { useAuth } from '@/contexts/authHelpers';

interface EventCardProps {
  event: AuthorEvent;
}

export const EventCard = ({ event }: EventCardProps) => {
  const { user } = useAuth();
  const { data: attendees, updateAttendance, isUpdating } = useEventAttendance(event.id);
  
  const userAttendance = attendees?.find(a => a.user_id === user?.id);
  const attendeeCount = attendees?.length || 0;

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'signing': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'livestream': return 'bg-red-500/10 text-red-700 dark:text-red-300';
      case 'reading': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'conference': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'attending': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'interested': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'maybe': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      {event.image_url && (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={getEventTypeColor(event.event_type)}>
                {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
              </Badge>
              {userAttendance && (
                <Badge className={getAttendanceColor(userAttendance.status)}>
                  {userAttendance.status.charAt(0).toUpperCase() + userAttendance.status.slice(1)}
                </Badge>
              )}
            </div>
            <CardTitle className="leading-tight">{event.title}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {event.description && (
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{format(new Date(event.start_date), 'PPP')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" />
            <span>{format(new Date(event.start_date), 'p')}</span>
            {event.end_date && (
              <span>- {format(new Date(event.end_date), 'p')}</span>
            )}
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-primary" />
            <span>
              {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} interested
              {event.max_attendees && (
                <span className="text-muted-foreground">
                  {' '}/ {event.max_attendees} max
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          {user && (
            <>
              <Button
                variant={userAttendance?.status === 'attending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAttendance({ status: 'attending' })}
                disabled={isUpdating}
              >
                Attending
              </Button>
              <Button
                variant={userAttendance?.status === 'interested' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAttendance({ status: 'interested' })}
                disabled={isUpdating}
              >
                Interested
              </Button>
              <Button
                variant={userAttendance?.status === 'maybe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateAttendance({ status: 'maybe' })}
                disabled={isUpdating}
              >
                Maybe
              </Button>
            </>
          )}
          
          {event.event_url && (
            <Button variant="outline" size="sm" asChild className="ml-auto">
              <a href={event.event_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-1" />
                Details
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};