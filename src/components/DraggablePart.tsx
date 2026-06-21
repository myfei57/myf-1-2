import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { PartCard } from './PartCard';
import type { Part } from '../types';

interface DraggablePartProps {
  part: Part;
}

export function DraggablePart({ part }: DraggablePartProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: part.id,
    data: { part },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      whileHover={{ scale: 1.02 }}
      className="cursor-grab active:cursor-grabbing"
    >
      <PartCard part={part} size="md" />
    </motion.div>
  );
}
