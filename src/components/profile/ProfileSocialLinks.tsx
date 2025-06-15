
import React from "react";
import { Link2 } from "lucide-react";

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" }
];

type ProfileSocialLinksProps = {
  social_links?: Record<string, string>;
};

const ProfileSocialLinks: React.FC<ProfileSocialLinksProps> = ({ social_links }) => (
  <div className="mt-4 w-full">
    <span className="text-xs text-gray-600">Social Links</span>
    <div className="flex gap-2 flex-wrap mt-1">
      {SOCIAL_FIELDS.map(({ key, label }) =>
        social_links?.[key] ? (
          <a key={key} href={social_links[key]} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline flex items-center gap-1 text-xs">
            <Link2 className="w-4 h-4" /> {label}
          </a>
        ) : null
      )}
      {!social_links || !Object.values(social_links).filter(Boolean).length && (
        <span className="italic text-gray-400">None</span>
      )}
    </div>
  </div>
);

export default ProfileSocialLinks;
