import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '@/services/contacts';
import type { Contact } from '@/types';

export const useContacts = (opportunityId: string) => {
  return useQuery({
    queryKey: ['contacts', opportunityId],
    queryFn: () => contactsService.getByOpportunity(opportunityId),
    enabled: !!opportunityId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.opportunityId] });
    },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      contactsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};
