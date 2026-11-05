import { useId, useState } from "react";
import { Button } from "~/components/Button";
import { TextField } from "~/components/TextField";

type LabelOption = {
  label: string;
  rank?: number;
};

type LabelSelectorProps = {
  mode: "chips" | "toggle" | "single";
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly LabelOption[];
  inputLabel: string;
  addLabel: string;
  selectedLabel?: string;
  suggestionsLabel?: string;
  maxVisibleSelected?: number;
  compact?: boolean;
};

const normalize = (label: string) => label.trim().toLowerCase();

export function LabelSelector({ mode, value, onChange, options, inputLabel, addLabel, selectedLabel, suggestionsLabel, maxVisibleSelected, compact = false }: LabelSelectorProps) {
  const groupName = useId();
  const [input, setInput] = useState("");
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const selected = new Set(value.map(normalize));
  const available = new Map<string, LabelOption>();

  for (const option of options) {
    const key = normalize(option.label);
    if (key && !available.has(key)) available.set(key, option);
  }
  if (mode !== "chips") {
    for (const label of [...customOptions, ...value]) {
      const key = normalize(label);
      if (key && !available.has(key)) available.set(key, { label });
    }
  }

  const filteredOptions = [...available.values()]
    .filter(option => normalize(option.label).includes(normalize(input)))
    .filter(option => mode !== "chips" || !selected.has(normalize(option.label)))
    .sort((first, second) => (second.rank ?? 0) - (first.rank ?? 0) || first.label.localeCompare(second.label));

  const add = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const canonical = available.get(normalize(trimmed))?.label ?? trimmed;
    if (mode !== "chips" && !available.has(normalize(canonical))) {
      setCustomOptions(previous => [...previous, canonical]);
    }
    if (mode === "single") onChange([canonical]);
    else if (!selected.has(normalize(canonical))) onChange([...value, canonical]);
    setInput("");
  };

  const remove = (label: string) => {
    if (mode === "toggle" && !options.some(option => normalize(option.label) === normalize(label))) {
      setCustomOptions(previous => previous.some(option => normalize(option) === normalize(label)) ? previous : [...previous, label]);
    }
    onChange(value.filter(entry => normalize(entry) !== normalize(label)));
  };

  const visibleSelected = showAll || maxVisibleSelected === undefined ? value : value.slice(0, maxVisibleSelected);

  return (
    <div>
      {mode === "chips" && (
        <>
          {selectedLabel && <p>{selectedLabel}</p>}
          <div className="flex flex-wrap">
            {visibleSelected.map((label) => (
              <Button key={normalize(label)} compact={compact} className={`max-w-full ${compact ? "px-2 py-1" : "px-4 py-2"} [overflow-wrap:anywhere]`} onClick={() => remove(label)} aria-label={`Remove ${label}`}>
                {label}
                <img src="/icons/delete.svg" alt="" className={`${compact ? "w-4 h-4 ml-1" : "w-6 h-6 ml-2"} inline-block dark:invert`} />
              </Button>
            ))}
          </div>
          {maxVisibleSelected !== undefined && value.length > maxVisibleSelected && (
            <Button compact={compact} onClick={() => setShowAll(previous => !previous)}>{showAll ? "Show fewer" : "Show all"}</Button>
          )}
          <hr className="w-full my-2" />
        </>
      )}
      <form className="flex flex-row items-center" onSubmit={(event) => { event.preventDefault(); add(input); }}>
        <div className="flex-1 min-w-0 m-2">
          <TextField placeholder={inputLabel} aria-label={inputLabel} value={input} onChange={setInput} className="w-full !m-0" />
        </div>
        <Button type="submit" compact={compact} className="flex-shrink-0">{addLabel}</Button>
      </form>
      {suggestionsLabel && <p>{suggestionsLabel}</p>}
      <div className="flex flex-wrap" role={mode === "single" ? "radiogroup" : undefined} aria-label={mode === "single" ? inputLabel : undefined}>
        {filteredOptions.map((option) => mode === "chips" ? (
          <Button key={normalize(option.label)} compact={compact} className={`max-w-full ${compact ? "px-2 py-1" : "px-4 py-2"} [overflow-wrap:anywhere]`} onClick={() => add(option.label)}>
            {option.label}
            <img src="/icons/add.svg" alt="" className={`w-4 h-4 inline-block ${compact ? "ml-1" : "ml-2"} dark:invert`} />
          </Button>
        ) : (
          <label key={normalize(option.label)} className={`${compact ? "m-1" : "m-2"} max-w-full cursor-pointer`}>
            <input
              type={mode === "single" ? "radio" : "checkbox"}
              name={mode === "single" ? groupName : undefined}
              checked={selected.has(normalize(option.label))}
              onChange={(event) => mode === "single" ? onChange([option.label]) : event.target.checked ? onChange([...value, option.label]) : remove(option.label)}
              className="peer sr-only"
            />
            <span className={`inline-block max-w-full rounded-lg border border-gray-400 ${compact ? "px-2 py-1 text-sm" : "px-4 py-2"} [overflow-wrap:anywhere] peer-checked:border-indigo-400 peer-checked:bg-indigo-100 dark:peer-checked:bg-indigo-900 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-400`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}