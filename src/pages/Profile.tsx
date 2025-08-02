
import React from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import TempSEO from "@/components/TempSEO";

const ProfilePage: React.FC = () => (
  <>
    <TempSEO
      title="User Profile - Sahadhyayi"
      description="View and manage your reader profile, update information, and explore your reading activity."
    />
    <ProfileView />
  </>
);

export default ProfilePage;
