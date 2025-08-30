
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { openPopupWindow } from "./openPopupWindow";

type ProfileTagsProps = {
  life_tags?: string[];
};

const handlePopup = () => {
  openPopupWindow("https://jeevan-katha-anek-hai1.lovable.app/", "My Life Stories");
};

const ProfileTags: React.FC<ProfileTagsProps> = ({ life_tags }) => (
  <div className="mt-4 w-full">
    <span className="text-xs text-gray-600">Tags / Life Phases</span>
    <div className="flex gap-2 flex-wrap mt-1">
      {life_tags && life_tags.length
        ? life_tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-default">
              {tag}
            </Badge>
          ))
        : <span className="italic text-gray-400">None</span>
      }
    </div>
    <div className="mt-3 flex justify-center">
      <Button
        variant="secondary"
        className="mt-1 w-full min-w-[180px] sm:w-auto flex items-center justify-center gap-2 text-amber-700 hover:bg-amber-50 hover:text-amber-900 focus:ring-2 focus:ring-amber-400 transition cursor-pointer"
        type="button"
        onClick={handlePopup}
        aria-label="Open My Life Stories in popup"
      >
        <span className="text-xl mr-1" aria-hidden="true">📖</span>
        <span className="font-medium">My Life Stories</span>
      </Button>
    </div>
  </div>
);

export default ProfileTags;
