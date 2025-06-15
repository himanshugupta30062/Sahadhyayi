
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProfileTagsProps = {
  life_tags?: string[];
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
      <a
        href="https://jeevan-katha-anek-hai1.lovable.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
        tabIndex={0}
        aria-label="Go to My Life Stories"
      >
        <Button
          variant="secondary"
          className="mt-1 w-full min-w-[180px] sm:w-auto flex items-center justify-center gap-2 text-amber-700 hover:bg-amber-50 hover:text-amber-900 focus:ring-2 focus:ring-amber-400 transition"
          type="button"
        >
          <span className="text-xl mr-1" aria-hidden="true">📖</span>
          <span className="font-medium">My Life Stories</span>
        </Button>
      </a>
    </div>
  </div>
);

export default ProfileTags;
