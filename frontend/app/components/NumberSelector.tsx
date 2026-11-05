import { useId } from "react";

type NumberSelectorProps = {
  label: string;
  value?: number;
  options?: readonly number[];
} & (
  | { allowDeselect: true; onChange: (value: number | undefined) => void }
  | { allowDeselect?: false; onChange: (value: number) => void }
);

export function NumberSelector(props: NumberSelectorProps) {
  const { label, value, options = [1, 2, 3, 4, 5] } = props;
  const name = useId();

  return (
    <fieldset className="min-w-0">
      <legend className="w-full text-center capitalize">{label}</legend>
      <div className="flex justify-around items-center py-2">
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => props.onChange(option)}
              onClick={() => {
                if (props.allowDeselect && value === option) props.onChange(undefined);
              }}
              className="peer sr-only"
            />
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-400 cursor-pointer peer-checked:border-indigo-400 peer-checked:bg-indigo-100 dark:peer-checked:bg-indigo-900 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-400">
              {option}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}