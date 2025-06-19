
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" }
];

type BasicProfileFieldsProps = {
  form: any;
};

const BasicProfileFields: React.FC<BasicProfileFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Full Name</FormLabel>
            <FormControl>
              <Input placeholder="Full Name" {...field} className="h-9" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="username"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Username</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Username" className="h-9" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        name="bio"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">About Me</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Your bio..." className="h-20 resize-none" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="dob"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Date of Birth</FormLabel>
            <FormControl>
              <Input type="date" {...field} className="h-9" />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="gender"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Gender</FormLabel>
            <FormControl>
              <select {...field} className="border rounded w-full h-9 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        name="location"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">Location / City</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter your city" className="h-9" />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};

export default BasicProfileFields;
