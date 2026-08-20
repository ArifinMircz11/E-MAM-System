import React, { Suspense, useEffect, useState } from 'react';
import { NavigationService } from '@/navigation/services/navigationService';
import { ViewLoader } from '@/components/ui/ViewLoader';

interface LazyModuleRendererProps {
  moduleId: string;
}

export const LazyModuleRenderer: React.FC<LazyModuleRendererProps> = ({ moduleId }) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadModule = async () => {
      try {
        const module = await NavigationService.getModule(moduleId);
        if (!module || !module.loader) {
          throw new Error(`Module ${moduleId} not found or has no loader.`);
        }
        const loadedComponent = await module.loader();
        if (mounted) {
          setComponent(() => loadedComponent);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err);
        }
      }
    };
    loadModule();
    return () => {
      mounted = false;
    };
  }, [moduleId]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md">
        Failed to load module: {error.message}
      </div>
    );
  }

  if (!Component) {
    return <ViewLoader />;
  }

  return (
    <Suspense fallback={<ViewLoader />}>
      <Component />
    </Suspense>
  );
};
