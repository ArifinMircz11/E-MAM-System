import { ViewState } from '@/types';
import React from 'react';

export interface NavTabConfig {
  view: ViewState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface FeatureNavItem {
  view: ViewState;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
  roles?: string[];
  color?: string;
  bg?: string;
  onClick?: () => void;
  isFrameless?: boolean;
}
