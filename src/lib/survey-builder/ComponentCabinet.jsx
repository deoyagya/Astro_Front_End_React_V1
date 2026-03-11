/**
 * ComponentCabinet — Left panel: draggable component palette.
 * REUSABLE — zero app imports.
 */

import { useDraggable } from '@dnd-kit/core';
import { COMPONENT_TYPE_LIST } from './constants';

function DraggableItem({ type }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `cabinet-${type.key}`,
    data: { type: type.key, fromCabinet: true },
  });

  return (
    <div
      ref={setNodeRef}
      className={`sb-cabinet-item ${isDragging ? 'sb-dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <i className={`fas ${type.icon}`} />
      <span>{type.label}</span>
    </div>
  );
}

export default function ComponentCabinet() {
  return (
    <div className="sb-cabinet">
      <h3 className="sb-cabinet-title">
        <i className="fas fa-puzzle-piece" /> Components
      </h3>
      <p className="sb-cabinet-hint">Drag to add</p>
      <div className="sb-cabinet-list">
        {COMPONENT_TYPE_LIST.map((type) => (
          <DraggableItem key={type.key} type={type} />
        ))}
      </div>
    </div>
  );
}
