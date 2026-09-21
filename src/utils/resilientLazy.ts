import { lazy } from 'react';
export const resilientLazy = (importFn: () => Promise<any>) => lazy(importFn);
