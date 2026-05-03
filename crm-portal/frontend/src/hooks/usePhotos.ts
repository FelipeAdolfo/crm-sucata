import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Photo } from '@/types';

export const usePhotos = (opportunityId: string) => {
  return useQuery({
    queryKey: ['photos', opportunityId],
    queryFn: async () => {
      const response = await api.get(`/photos/opportunity/${opportunityId}`);
      return response.data as Photo[];
    },
  });
};

export const useUploadPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, formData) => {
      const opportunityId = formData.get('opportunityId') as string;
      queryClient.invalidateQueries({ queryKey: ['photos', opportunityId] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', opportunityId] });
    },
  });
};

export const useDeletePhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/photos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
};
