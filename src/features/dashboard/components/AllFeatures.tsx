import React from 'react';
import Layout from '@/layouts/Layout';
import { ViewState, UserRole } from '@/types';
import { Squares2x2Icon } from '@/shared/Icons';
import FeatureGridLauncher from '@/components/ui/FeatureGridLauncher';

interface AllFeaturesProps {
  onBack: () => void;
  onOpenSidebar?: () => void;
  onNavigate: (v: ViewState) => void;
  userRole: UserRole;
  onLogout?: () => void;
  unreadNotifCount?: number;
  unreadChatCount?: number;
  pendingLetterCount?: number;
  pendingApprovalCount?: number;
}

const AllFeatures: React.FC<AllFeaturesProps> = ({
  onBack,
  onOpenSidebar,
  onNavigate,
  userRole,
  unreadNotifCount = 0,
  unreadChatCount = 0,
  pendingLetterCount = 0,
}) => {
  return (
    <Layout
      title="Eksplorasi Fitur"
      subtitle="Akses cepat seluruh layanan madrasah"
      icon={Squares2x2Icon}
      onBack={onBack}
      onOpenSidebar={onOpenSidebar}
      withBottomNav={true}
    >
      <FeatureGridLauncher
        onNavigate={onNavigate}
        userRole={userRole}
        unreadNotifCount={unreadNotifCount}
        unreadChatCount={unreadChatCount}
        pendingLetterCount={pendingLetterCount}
      />
    </Layout>
  );
};

export default AllFeatures;

