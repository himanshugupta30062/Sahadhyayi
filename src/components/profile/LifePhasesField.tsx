
import React from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";

const PHASES = [
  "School Life", "College Days", "Startup Journey", "Parenting", "Travelling", "Remote Work", "Self Discovery"
];

type LifePhasesFieldProps = {
  form: any;
};

const LifePhasesField: React.FC<LifePhasesFieldProps> = ({ form }) => {
  return (
    <FormField
      name="life_tags"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Life Phases / Tags</FormLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PHASES.map(phase => (
              <label key={phase} className="flex items-center gap-2 text-xs cursor-pointer bg-amber-50 rounded px-3 py-2 border hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={field.value?.includes(phase) || false}
                  onChange={e => {
                    const checked = e.target.checked;
                    field.onChange(
                      checked
                        ? [...(field.value || []), phase]
                        : (field.value || []).filter((v: string) => v !== phase)
                    );
                  }}
                  className="accent-amber-600 w-3 h-3"
                />
                <span className="flex-1">{phase}</span>
              </label>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
};

export default LifePhasesField;
