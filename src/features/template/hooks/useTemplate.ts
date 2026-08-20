import { useState, useEffect, useCallback } from 'react';
import { TenantContext } from '@/core/context/TenantContext';
import { templateService } from '../services/TemplateService';
import type { ITemplateEntity } from '@/repositories/contracts/ITemplateRepository';
import type { TemplateFormData } from '../schemas/template.schema';
import { useTemplateStore } from '../state/templateStore';

export function useTemplate() {
  const securityContext = TenantContext.getContext() as any;
  const [items, setItems] = useState<ITemplateEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { filter, setSelectedItem, setModalOpen } = useTemplateStore();

  const loadItems = useCallback(async () => {
    if (!securityContext) return;
    setLoading(true);
    setError(null);
    try {
      const data = await templateService.getList(securityContext);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [securityContext]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const createItem = async (formData: TemplateFormData) => {
    if (!securityContext) throw new Error('No security context');
    setLoading(true);
    try {
      await templateService.create(securityContext, formData);
      await loadItems();
      setModalOpen(false);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, formData: TemplateFormData) => {
    if (!securityContext) throw new Error('No security context');
    setLoading(true);
    try {
      await templateService.update(securityContext, id, formData);
      await loadItems();
      setModalOpen(false);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!securityContext) throw new Error('No security context');
    setLoading(true);
    try {
      await templateService.delete(securityContext, id);
      await loadItems();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filtered items based on filter state
  const filteredItems = items.filter((item) => {
    if (!filter.searchQuery) return true;
    const q = filter.searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  return {
    items: filteredItems,
    rawItems: items,
    loading,
    error,
    refresh: loadItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
