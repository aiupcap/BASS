/* eslint-disable react/prop-types */
import { Trash2 } from 'lucide-react';
import { Button } from '@bass/ui/components/button';
import { Card, CardContent } from '@bass/ui/components/card';
import { cn } from '@bass/ui/lib/utils';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatHistoryListProps {
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  visible: boolean;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({ sessions, onSessionSelect, onSessionDelete, visible }) => {
  if (!visible) return null;

  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const deltaSeconds = Math.floor((now - timestamp) / 1000);

    // Less than 1 minute
    if (deltaSeconds < 60) {
      return `${deltaSeconds} seconds ago`;
    }

    // Less than 1 hour
    const deltaMinutes = Math.floor(deltaSeconds / 60);
    if (deltaMinutes < 60) {
      return `${deltaMinutes} ${deltaMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than 24 hours
    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) {
      const remainingMinutes = deltaMinutes % 60;
      const hourText = `${deltaHours} ${deltaHours === 1 ? 'hour' : 'hours'}`;
      const minuteText =
        remainingMinutes > 0 ? ` ${remainingMinutes} ${remainingMinutes === 1 ? 'minute' : 'minutes'}` : '';
      return `${hourText}${minuteText} ago`;
    }

    // More than 24 hours - use standard date format
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      {sessions.length === 0 ? (
        <Card className="bg-background/30 backdrop-blur-sm">
          <CardContent className="p-4 text-muted-foreground text-center">No chat history</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <Card
              key={session.id}
              className={cn(
                'group backdrop-blur-sm bg-background/50 hover:bg-background/70 transition-all',
                'border-sky-100',
              )}>
              <CardContent className="p-4 flex items-center">
                <Button
                  variant="ghost"
                  className="flex-1 h-auto p-0 justify-start hover:bg-transparent"
                  onClick={() => onSessionSelect(session.id)}>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(session.createdAt)}</p>
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSessionDelete(session.id)}
                  className="ml-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete chat session">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistoryList;
