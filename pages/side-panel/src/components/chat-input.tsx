import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@bass/ui/components/textarea';
import { Button } from '@bass/ui/components/button';
import { cn } from '@bass/ui/lib/utils';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopTask: () => void;
  disabled: boolean;
  showStopButton: boolean;
  setContent?: (setter: (text: string) => void) => void;
}

export default function ChatInput({ onSendMessage, onStopTask, disabled, showStopButton, setContent }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text changes and resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  };

  // Expose a method to set content from outside
  useEffect(() => {
    if (setContent) {
      setContent(setText);
    }
  }, [setContent]);

  // Initial resize when component mounts
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim()) {
        onSendMessage(text);
        setText('');
      }
    },
    [text, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden transition-colors rounded-lg border"
      aria-label="Chat input form">
      <div className="flex flex-col">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={4}
          className={cn(
            'resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0',
            disabled && 'opacity-50',
          )}
          placeholder="How can I help you?"
          aria-label="Message input"
        />

        <div className={cn('flex items-center justify-between px-3 py-1.5', disabled && 'opacity-50')}>
          <div className="flex gap-2">{/* Icons can go here */}</div>

          {showStopButton ? (
            <Button type="button" onClick={onStopTask} variant="destructive" size="sm">
              Stop
            </Button>
          ) : (
            <Button type="submit" disabled={disabled} variant="default" size="sm">
              Send
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
