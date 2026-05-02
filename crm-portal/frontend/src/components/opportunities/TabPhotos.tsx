import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, MapPin, Container, FileText, Camera } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { usePhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos';
import toast from 'react-hot-toast';

interface TabPhotosProps {
  opportunityId: string;
}

const categoryLabels: Record<string, string> = {
  SCRAP: 'Sucata',
  LOCATION: 'Local',
  ACCESS: 'Acesso',
  CONTAINER: 'Caçamba',
  DOCUMENT: 'Documento',
  OTHER: 'Outro',
};

const categoryIcons: Record<string, React.ElementType> = {
  SCRAP: Camera,
  LOCATION: MapPin,
  ACCESS: MapPin,
  CONTAINER: Container,
  DOCUMENT: FileText,
  OTHER: ImageIcon,
};

export const TabPhotos: React.FC<TabPhotosProps> = ({ opportunityId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('SCRAP');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { data: photos, isLoading } = usePhotos(opportunityId);
  const uploadPhoto = useUploadPhoto();
  const deletePhoto = useDeletePhoto();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione uma imagem');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('opportunityId', opportunityId);
    formData.append('category', selectedCategory);
    formData.append('description', description);

    try {
      await uploadPhoto.mutateAsync(formData);
      toast.success('Foto enviada!');
      setIsModalOpen(false);
      setSelectedFile(null);
      setDescription('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao enviar foto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
    try {
      await deletePhoto.mutateAsync(id);
      toast.success('Foto excluída!');
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

  // Agrupar fotos por categoria
  const groupedPhotos = photos?.reduce((acc, photo) => {
    if (!acc[photo.category]) acc[photo.category] = [];
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fotos</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Adicionar Foto
        </Button>
      </div>

      {Object.entries(groupedPhotos || {}).map(([category, categoryPhotos]) => {
        const Icon = categoryIcons[category] || ImageIcon;
        return (
          <div key={category} className="space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {categoryLabels[category]}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categoryPhotos?.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.description || 'Foto'}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-2 right-2 p-1 bg-danger-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {photo.description && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{photo.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {photos?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Nenhuma foto adicionada
        </div>
      )}

      {/* Modal Upload */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adicionar Foto"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} isLoading={uploadPhoto.isPending}>
              Enviar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5"
              placeholder="Descrição da foto..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
          </div>

          {selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Pré-visualização:</p>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="max-h-48 rounded-lg"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
