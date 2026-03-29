function tryOpenPicker(target) {
  if (typeof target?.showPicker === 'function') {
    try {
      target.showPicker();
    } catch {
      // Ignore browsers that restrict picker open in some contexts.
    }
  }
}

export default function TimeInput({ onClick, onFocus, onChange, ...props }) {
  const handleClick = (e) => {
    tryOpenPicker(e.currentTarget);
    onClick?.(e);
  };

  const handleFocus = (e) => {
    tryOpenPicker(e.currentTarget);
    onFocus?.(e);
  };

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  return (
    <input
      type="time"
      {...props}
      onClick={handleClick}
      onFocus={handleFocus}
      onChange={handleChange}
    />
  );
}
