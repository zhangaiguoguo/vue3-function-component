import { useCallback, useEffect, useRef } from "vue-function-component";

const sanitize = (string) => {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  const reg = /[&<>"'/]/gi;
  return string.replace(reg, (match) => map[match]);
};

const hasValidMin = (value, min) => {
  return value.length >= min;
};

export function Input({ onSubmit, placeholder, label, defaultValue, onBlur }) {
  const handleBlur = useCallback(() => {
    if (onBlur) onBlur();
  }, [onBlur]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current!.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const value = e.target.value.trim();

        if (!hasValidMin(value, 2)) return;

        onSubmit(sanitize(value));
        e.target.value = "";
      }
    },
    [onSubmit]
  );
  return (
    <div class="input-container">
      <input
        class="new-todo"
        id="todo-input"
        type="text"
        autofocus={true}
        ref={inputRef}
        placeholder={placeholder}
        value={defaultValue}
        onBlur={handleBlur}
        onKeydown={handleKeyDown}
      />
      {label ? (
        <label class="visually-hidden" htmlFor="todo-input">
          {label}
        </label>
      ) : null}
    </div>
  );
}
