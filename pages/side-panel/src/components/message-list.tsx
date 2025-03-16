import type { Message } from '@bass/storage';
import { ACTOR_PROFILES } from '../types/message';
import { memo } from 'react';
import { Card, CardContent } from '@bass/ui/components/card';
import { cn } from '@bass/ui/lib/utils';

interface MessageListProps {
  messages: Message[];
}

export default memo(function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4 max-w-full">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
        />
      ))}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
}

function MessageBlock({ message, isSameActor }: MessageBlockProps) {
  if (!message.actor) {
    console.error('No actor found');
    return <div />;
  }
  const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';

  return (
    <Card
      className={cn(
        'border-0 shadow-none bg-transparent',
        !isSameActor && 'border-t border-sky-200/50 mt-4 pt-4 first:border-t-0 first:mt-0 first:pt-0',
      )}>
      <CardContent className="flex gap-3 p-4 max-w-full">
        {!isSameActor && (
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: actor.iconBackground }}>
            <img src={actor.icon} alt={actor.name} className="w-6 h-6" />
          </div>
        )}
        {isSameActor && <div className="w-8" />}

        <div className="flex-1 min-w-0">
          {!isSameActor && <div className="font-semibold text-sm text-foreground mb-1">{actor.name}</div>}

          <div className="space-y-0.5">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {isProgress ? (
                <div className="h-1 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary animate-progress" />
                </div>
              ) : (
                message.content
              )}
            </div>
            {!isProgress && (
              <div className="text-xs text-muted-foreground/50 text-right">{formatTimestamp(message.timestamp)}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Formats a timestamp (in milliseconds) to a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if the message is from today
  const isToday = date.toDateString() === now.toDateString();

  // Check if the message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Check if the message is from this year
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Format the time (HH:MM)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr; // Just show the time for today's messages
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    // Show month and day for this year
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  // Show full date for older messages
  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}
