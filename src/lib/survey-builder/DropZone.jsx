/**
 * DropZone — Right panel: sortable question canvas.
 * REUSABLE — zero app imports.
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { COMPONENT_TYPES } from './constants';

function SortableQuestion({ question, isSelected, onSelect, onDelete }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = COMPONENT_TYPES[question.type] || {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sb-question-card ${isSelected ? 'sb-question-selected' : ''}`}
      onClick={() => onSelect(question.id)}
    >
      <div className="sb-question-drag" {...attributes} {...listeners}>
        <i className="fas fa-grip-vertical" />
      </div>
      <div className="sb-question-body">
        <span className="sb-question-type-badge">
          <i className={`fas ${typeInfo.icon || 'fa-question'}`} />
          {typeInfo.label || question.type}
        </span>
        <span className="sb-question-label">{question.label || 'Untitled'}</span>
        {question.required && <span className="sb-required-badge">Required</span>}
      </div>
      <button
        type="button"
        className="sb-question-delete"
        onClick={(e) => { e.stopPropagation(); onDelete(question.id); }}
        title="Remove question"
      >
        <i className="fas fa-trash-alt" />
      </button>
    </div>
  );
}

export default function DropZone({ questions, selectedId, onSelect, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'dropzone' });
  const ids = questions.map((q) => q.id);

  return (
    <div ref={setNodeRef} className={`sb-dropzone ${isOver ? 'sb-dropzone-over' : ''}`}>
      {questions.length === 0 ? (
        <div className="sb-dropzone-empty">
          <i className="fas fa-hand-point-left" />
          <p>Drag components here to build your form</p>
        </div>
      ) : (
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {questions.map((q) => (
            <SortableQuestion
              key={q.id}
              question={q}
              isSelected={selectedId === q.id}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );
}
