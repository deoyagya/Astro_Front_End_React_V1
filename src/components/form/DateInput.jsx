function tryOpenPicker(target) {
  if (typeof target?.showPicker === 'function') {
    try {
      target.showPicker();
    } catch {
      // Ignore browsers that restrict picker open in some contexts.
    }
  }
}

export default function DateInput({ onClick, onFocus, onChange, ...props }) {
  const handleClick = (e) => {
    tryOpenPicker(e.currentTarget);
    onClick?.(e);
  };

  const handleFocus = (e) => {
    tryOpenPicker(e.currentTarget);
    onFocus?.(e);
  };

  const handleChange = (e) => {
    // If an onChange callback is provided, call it with the value (YYYY-MM-DD string)
    if (onChange) onChange(e.target.value);
  };

  return (
    <input
      type="date"
      {...props}
      onClick={handleClick}
      onFocus={handleFocus}
      onChange={handleChange}
    />
  );
}
