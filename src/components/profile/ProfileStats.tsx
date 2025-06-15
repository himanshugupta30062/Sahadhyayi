
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" }
];

type ProfileStatsProps = {
  writingFrequency: string;
  gender?: string;
  joined_at?: string;
};

const ProfileStats: React.FC<ProfileStatsProps> = ({ writingFrequency, gender, joined_at }) => (
  <div className="flex flex-wrap gap-2 items-center justify-center">
    <Badge variant="secondary">{writingFrequency}</Badge>
    <Badge variant="outline">
      {gender ? GENDER_OPTIONS.find((g) => g.value === gender)?.label : "Not set"}
    </Badge>
    {joined_at && (
      <Badge variant="outline">
        <Calendar className="w-4 h-4 mr-1 inline" />
        Joined {format(new Date(joined_at), "MMM y")}
      </Badge>
    )}
  </div>
);

export default ProfileStats;
