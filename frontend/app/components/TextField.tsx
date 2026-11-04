import { useId } from "react";

export function TextError({ error, id }: { error: string; id?: string }) {
  return <p id={id} className="text-sm text-red-500">{error}</p>;
}

export function TextField({ label, name, type = "text", value, onChange, textError, className,...options }: { label?: string; name?: string; type?: "text" | "date"; value: string; onChange: (value: string) => void; textError?: string; [key: string]: any }) {
  const errorId = useId();

  return (
    <label>
      {label && <p>{label}</p>}
      <input name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!textError} aria-describedby={textError ? errorId : undefined} className={`border rounded-lg p-2 m-2 bg-white dark:bg-gray-900 dark:text-white ${className ?? ""}`} {...options} />
      {textError && <TextError id={errorId} error={textError} />}
    </label>
  );
}

export default { TextField, TextError }