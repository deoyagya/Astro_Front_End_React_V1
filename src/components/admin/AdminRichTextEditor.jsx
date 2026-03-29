import { useEffect, useRef } from 'react';
import '../../styles/admin-legal.css';

function runCommand(command, value = null) {
  if (command === 'highlight') {
    document.execCommand('hiliteColor', false, '#fff3a3');
    document.execCommand('backColor', false, '#fff3a3');
    return;
  }
  if (command === 'link') {
    const url = window.prompt('Enter the URL to link to:');
    if (!url) return;
    document.execCommand('createLink', false, url);
    return;
  }
  document.execCommand(command, false, value);
}

const TOOLBAR = [
  { label: 'Bold', icon: 'fa-bold', action: () => runCommand('bold') },
  { label: 'Italic', icon: 'fa-italic', action: () => runCommand('italic') },
  { label: 'Underline', icon: 'fa-underline', action: () => runCommand('underline') },
  { label: 'Highlight', icon: 'fa-highlighter', action: () => runCommand('highlight') },
  { label: 'Heading', icon: 'fa-heading', action: () => runCommand('formatBlock', '<h2>') },
  { label: 'Subheading', icon: 'fa-text-height', action: () => runCommand('formatBlock', '<h3>') },
  { label: 'Bullets', icon: 'fa-list-ul', action: () => runCommand('insertUnorderedList') },
  { label: 'Numbers', icon: 'fa-list-ol', action: () => runCommand('insertOrderedList') },
  { label: 'Link', icon: 'fa-link', action: () => runCommand('link') },
  { label: 'Clear', icon: 'fa-eraser', action: () => runCommand('removeFormat') },
];

export default function AdminRichTextEditor({ value, onChange, minHeight = 360 }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  return (
    <div className="legal-editor">
      <div className="legal-editor-toolbar">
        {TOOLBAR.map((item) => (
          <button
            key={item.label}
            type="button"
            className="btn-edit legal-editor-tool"
            onClick={item.action}
            title={item.label}
          >
            <i className={`fas ${item.icon}`}></i>
            <span className="sr-only">{item.label}</span>
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        className="legal-editor-surface"
        style={{ minHeight }}
      />
    </div>
  );
}
