
import React from "react";
import { Form } from "@/components/ui/form";
import BasicProfileFields from "./BasicProfileFields";
import LifePhasesField from "./LifePhasesField";
import SocialLinksField from "./SocialLinksField";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";

type ProfileFormContentProps = {
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
};

const ProfileFormContent: React.FC<ProfileFormContentProps> = ({ form, onSubmit }) => {
  return (
    <Form {...form}>
      <form className="space-y-4 py-4" onSubmit={form.handleSubmit(onSubmit)}>
        <BasicProfileFields form={form} />
        <LifePhasesField form={form} />
        <SocialLinksField form={form} />
      </form>
    </Form>
  );
};

export default ProfileFormContent;
