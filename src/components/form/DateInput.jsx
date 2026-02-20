function tryOpenPicker(target) {
  if (typeof target?.showPicker === 'function') {
    try {
      target.showPicker();
    } catch {
      // Ignore browsers that restrict picker open in some contexts.
    }
  }
}

export default function DateInput({ onClick, onFocus, ...props }) {
  const handleClick = (e) => {
    tryOpenPicker(e.currentTarget);
    onClick?.(e);
  };

  const handleFocus = (e) => {
    tryOpenPicker(e.currentTarget);
    onFocus?.(e);
  };

  return <input type="date" {...props} onClick={handleClick} onFocus={handleFocus} />;
}
