import React, { useState } from 'react';
import { Plus, Phone, Mail, Linkedin, Facebook, Instagram, Star, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, Modal, Input } from '@/components/ui';
import { useContacts } from '@/hooks/useContacts';
import toast from 'react-hot-toast';

interface TabContactsProps {
  opportunityId: string;
}

interface ContactFormData {
  name: string;
  role: string;
  email: string;
  phoneMobile: string;
  phoneLandline: string;
  extension: string;
  linkedinUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  isMainContact: boolean;
}

export const TabContacts: React.FC<TabContactsProps> = ({ opportunityId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: contacts, isLoading } = useContacts(opportunityId);
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    role: '',
    email: '',
    phoneMobile: '',
    phoneLandline: '',
    extension: '',
    linkedinUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    isMainContact: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({ opportunityId, ...formData });
      toast.success('Contato adicionado!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        role: '',
        email: '',
        phoneMobile: '',
        phoneLandline: '',
        extension: '',
        linkedinUrl: '',
        facebookUrl: '',
        instagramUrl: '',
        isMainContact: false,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao adicionar contato');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    try {
      await deleteContact.mutateAsync(id);
      toast.success('Contato excluído!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao excluir');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Contatos</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Adicionar Contato
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts?.map((contact) => (
          <Card key={contact.id} className={contact.isMainContact ? 'border-primary-300' : ''}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{contact.name}</h4>
                    {contact.isMainContact && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {contact.role && <p className="text-sm text-gray-500">{contact.role}</p>}
                </div>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-gray-400 hover:text-danger-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {contact.phoneMobile && (
                  <a href={`tel:${contact.phoneMobile}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600">
                    <Phone className="w-4 h-4" />
                    {contact.phoneMobile}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600">
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
                {contact.phoneLandline && (
                  <p className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="w-4 h-4" />
                    {contact.phoneLandline} {contact.extension && `ramal ${contact.extension}`}
                  </p>
                )}
              </div>

              {(contact.linkedinUrl || contact.facebookUrl || contact.instagramUrl) && (
                <div className="mt-4 flex gap-3">
                  {contact.linkedinUrl && (
                    <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {contact.facebookUrl && (
                    <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900">
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                  {contact.instagramUrl && (
                    <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {contacts?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhum contato cadastrado
        </div>
      )}

      {/* Modal Novo Contato */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Contato"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} isLoading={createContact.isPending}>
              Salvar
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Cargo"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Celular"
              value={formData.phoneMobile}
              onChange={(e) => setFormData({ ...formData, phoneMobile: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefone Fixo"
              value={formData.phoneLandline}
              onChange={(e) => setFormData({ ...formData, phoneLandline: e.target.value })}
            />
            <Input
              label="Ramal"
              value={formData.extension}
              onChange={(e) => setFormData({ ...formData, extension: e.target.value })}
            />
          </div>
          <Input
            label="LinkedIn"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
          <Input
            label="Facebook"
            value={formData.facebookUrl}
            onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
            placeholder="https://facebook.com/..."
          />
          <Input
            label="Instagram"
            value={formData.instagramUrl}
            onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
            placeholder="https://instagram.com/..."
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isMainContact}
              onChange={(e) => setFormData({ ...formData, isMainContact: e.target.checked })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm">Contato principal</span>
          </label>
        </form>
      </Modal>
    </div>
  );
};

// Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { Contact } from '@/types';

const useContacts = (opportunityId: string) => {
  return useQuery({
    queryKey: ['contacts', opportunityId],
    queryFn: async () => {
      const response = await api.get(`/contacts/opportunity/${opportunityId}`);
      return response.data as Contact[];
    },
  });
};

const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/contacts', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.opportunityId] });
    },
  });
};

const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};
