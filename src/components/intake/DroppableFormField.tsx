import { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface DroppableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onDropValue: (value: string) => void;
}

interface DroppableTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onDropValue: (value: string) => void;
}

export const DroppableInput = forwardRef<HTMLInputElement, DroppableInputProps>(
  ({ className, onDropValue, ...props }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
        onDropValue(text);
      }
    };

    return (
      <Input
        ref={ref}
        className={cn(
          className,
          isDragOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      />
    );
  }
);

DroppableInput.displayName = 'DroppableInput';

export const DroppableTextarea = forwardRef<HTMLTextAreaElement, DroppableTextareaProps>(
  ({ className, onDropValue, ...props }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const text = e.dataTransfer.getData('text/plain');
      if (text) {
        onDropValue(text);
      }
    };

    return (
      <Textarea
        ref={ref}
        className={cn(
          className,
          isDragOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        {...props}
      />
    );
  }
);

DroppableTextarea.displayName = 'DroppableTextarea';
