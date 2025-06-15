
import React from "react";
import ProfileStats from "./ProfileStats";

type ProfileInfoProps = {
  name?: string;
  username?: string;
  email?: string;
  bio?: string;
  gender?: string;
  writingFrequency: string;
  joined_at?: string;
  // Add children for custom actions/badges if needed
};

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  name,
  username,
  email,
  bio,
  gender,
  writingFrequency,
  joined_at
}) => (
  <div className="w-full flex flex-col items-center text-center">
    <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
      {name || "Unnamed"}
      <span className="text-amber-500 font-mono text-base">{username && <>@{username}</>}</span>
    </h2>
    <div className="flex justify-center items-center gap-2 mt-1 mb-2 text-gray-600 text-sm">
      <span>{email || "No email"}</span>
    </div>
    <p className="text-gray-600 text-base mb-2">{bio}</p>
    <ProfileStats writingFrequency={writingFrequency} gender={gender} joined_at={joined_at} />
  </div>
);

export default ProfileInfo;
