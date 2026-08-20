import { useMemo } from 'react';
import { DEVELOPER_TABS } from '../constants/tabs';
import { DeveloperTabKey } from '../types/DeveloperTab';

export const useDeveloperTabs = (categoryFilter?: string) => {
  const tabs = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') {
      return DEVELOPER_TABS;
    }
    return DEVELOPER_TABS.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  const getTabLabel = (key: DeveloperTabKey) => {
    return DEVELOPER_TABS.find((t) => t.id === key)?.label || key;
  };

  return {
    tabs,
    getTabLabel,
  };
};
