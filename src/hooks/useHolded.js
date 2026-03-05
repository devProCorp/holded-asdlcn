import { useQuery } from '@tanstack/react-query';
import * as api from '../api/holded';

export const useContacts = () =>
  useQuery({ queryKey: ['contacts'], queryFn: api.getContacts });

export const useDocuments = (docType, params = {}) =>
  useQuery({
    queryKey: ['documents', docType, params],
    queryFn: () => api.getDocuments(docType, params),
  });

export const useProducts = () =>
  useQuery({ queryKey: ['products'], queryFn: api.getProducts });

export const useServices = () =>
  useQuery({ queryKey: ['services'], queryFn: api.getServices });

export const useTreasury = () =>
  useQuery({ queryKey: ['treasury'], queryFn: api.getTreasury });

export const usePayments = (params = {}) =>
  useQuery({
    queryKey: ['payments', params],
    queryFn: () => api.getPayments(params),
  });

export const useExpensesAccounts = () =>
  useQuery({ queryKey: ['expensesAccounts'], queryFn: api.getExpensesAccounts });

export const useTaxes = () =>
  useQuery({ queryKey: ['taxes'], queryFn: api.getTaxes });

export const useWarehouses = () =>
  useQuery({ queryKey: ['warehouses'], queryFn: api.getWarehouses });
