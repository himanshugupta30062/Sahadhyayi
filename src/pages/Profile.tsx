import React from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import Breadcrumb from "@/components/Breadcrumb";
import SEO from "@/components/SEO";

const ProfilePage: React.FC = () => {
  const breadcrumbItems = [
    { name: 'Profile', path: '/profile', current: true }
  ];

  return (
    <>
      <SEO
        title="User Profile - Sahadhyayi"
        description="View and manage your reader profile, update information, and explore your reading activity."
        canonical="https://sahadhyayi.com/profile"
        url="https://sahadhyayi.com/profile"
      />
      <div className="container mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        <ProfileView />
      </div>
    </>
  );
};

export default ProfilePage;
