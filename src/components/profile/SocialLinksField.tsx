
import React from "react";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" }
];

type SocialLinksFieldProps = {
  form: UseFormReturn<ProfileFormValues>;
};

const SocialLinksField: React.FC<SocialLinksFieldProps> = ({ form }) => {
  return (
    <FormField
      name="social_links"
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">Social Links</FormLabel>
          <div className="space-y-2">
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                type="url"
                placeholder={`${label} URL`}
                value={field.value?.[key] || ""}
                onChange={e => {
                  const val = e.target.value;
                  field.onChange({ ...field.value, [key]: val });
                }}
                className="h-9 text-sm"
              />
            ))}
          </div>
        </FormItem>
      )}
    />
  );
};

export default SocialLinksField;
