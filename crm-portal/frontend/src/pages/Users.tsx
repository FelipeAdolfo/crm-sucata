import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Lock,
  Unlock,
  Mail,
  Shield,
  UserCheck,
  UserX,
  MoreVertical,
  Key,
  Smartphone,
  Linkedin,
  Facebook,
  Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { User, UserRole, UserStatus } from '@/types';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PARTNER: 'Sócio',
  BUYER: 'Comprador',
  ANALYST: 'Analista',
  MANAGER: 'Gerente',
  DIRECTOR: 'Diretor',
  INTEL_COORDINATOR: 'Coord. Inteligência',
};

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  PARTNER: 'bg-blue-100 text-blue-700',
  BUYER: 'bg-green-100 text-green-700',
  ANALYST: 'bg-orange-100 text-orange-700',
  MANAGER: 'bg-red-100 text-red-700',
  DIRECTOR: 'bg-indigo-100 text-indigo-700',
  INTEL_COORDINATOR: 'bg-pink-100 text-pink-700',
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  PENDING: 'Pendente',
  SUSPENDED: 'Suspenso',
};

const statusColors: Record<UserStatus, string> = {
  ACTIVE: 'bg-success-100 text-success-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUSPENDED: 'bg-danger-100 text-danger-700',
};

export const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActions, setShowActions] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get<User[]>(`/users?${params.toString()}`);
      return data;
    },
  });

  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setShowActions(null);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{users?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ativos</p>
              <p className="text-xl font-bold text-gray-900">
                {users?.filter(u => u.status === 'ACTIVE').length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Com 2FA</p>
              <p className="text-xl font-bold text-gray-900">
                {users?.filter(u => u.twoFactorEnabled).length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-xl font-bold text-gray-900">
                {users?.filter(u => u.status === 'PENDING').length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos os cargos</option>
              <option value="PARTNER">Sócio</option>
              <option value="DIRECTOR">Diretor</option>
              <option value="MANAGER">Gerente</option>
              <option value="INTEL_COORDINATOR">Coord. Inteligência</option>
              <option value="BUYER">Comprador</option>
              <option value="ANALYST">Analista</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="PENDING">Pendente</option>
              <option value="SUSPENDED">Suspenso</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Usuario</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Cargo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Redes Sociais</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Dispositivo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Ultimo Acesso</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.linkedinUrl ? (
                        <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="LinkedIn">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      ) : (
                        <Linkedin className="w-4 h-4 text-gray-200" />
                      )}
                      {user.facebookUrl ? (
                        <a href={user.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800" title="Facebook">
                          <Facebook className="w-4 h-4" />
                        </a>
                      ) : (
                        <Facebook className="w-4 h-4 text-gray-200" />
                      )}
                      {user.instagramUrl ? (
                        <a href={user.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800" title="Instagram">
                          <Instagram className="w-4 h-4" />
                        </a>
                      ) : (
                        <Instagram className="w-4 h-4 text-gray-200" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={statusColors[user.status]}>
                      {statusLabels[user.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {user.deviceStatus === 'LINKED' ? (
                      <div className="flex items-center gap-1 text-green-600" title={user.deviceModel || ''}>
                        <Smartphone className="w-4 h-4" />
                        <span className="text-xs">{user.deviceModel || 'Android'}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Nao vinculado</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500">
                      {user.lastLoginAt 
                        ? format(parseISO(user.lastLoginAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })
                        : 'Nunca'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {showActions === user.id && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => {/* Reset password */}}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                          >
                            <Key className="w-4 h-4" />
                            Resetar Senha
                          </button>
                          {user.status === 'ACTIVE' ? (
                            <button
                              onClick={() => {/* Suspend user */}}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 text-danger-600"
                            >
                              <Lock className="w-4 h-4" />
                              Suspender
                            </button>
                          ) : (
                            <button
                              onClick={() => {/* Activate user */}}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 text-success-600"
                            >
                              <Unlock className="w-4 h-4" />
                              Ativar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="lg"
      >
        <UserForm
          user={selectedUser}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      </Modal>
    </div>
  );
};

// User Form Component
const UserForm: React.FC<{ user: User | null; onClose: () => void }> = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
    role: user?.role || 'BUYER' as UserRole,
    status: user?.status || 'PENDING' as UserStatus,
    linkedinUrl: user?.linkedinUrl || '',
    facebookUrl: user?.facebookUrl || '',
    instagramUrl: user?.instagramUrl || '',
    deviceId: user?.deviceId || '',
    deviceModel: user?.deviceModel || '',
    deviceStatus: user?.deviceStatus || 'UNLINKED',
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.post('/users', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.put(`/users/${user?.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateUser.mutate(formData);
    } else {
      createUser.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: João Silva"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="exemplo@email.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <Input
            value={formData.cpf}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cargo *
          </label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="PARTNER">Sócio</option>
            <option value="DIRECTOR">Diretor</option>
            <option value="MANAGER">Gerente</option>
            <option value="INTEL_COORDINATOR">Coord. Inteligência</option>
            <option value="BUYER">Comprador</option>
            <option value="ANALYST">Analista</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            required
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="PENDING">Pendente</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
        </div>
      </div>

      {/* Redes Sociais */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Redes Sociais
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="LinkedIn"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/perfil"
          />
          <Input
            label="Facebook"
            value={formData.facebookUrl}
            onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
            placeholder="https://facebook.com/perfil"
          />
          <Input
            label="Instagram"
            value={formData.instagramUrl}
            onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
            placeholder="https://instagram.com/perfil"
          />
        </div>
      </div>

      {/* Dispositivo (edição) */}
      {user && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Dispositivo Celular
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ID do Dispositivo"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              placeholder="Ex: android-device-id"
            />
            <Input
              label="Modelo"
              value={formData.deviceModel}
              onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
              placeholder="Ex: Samsung Galaxy S23"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status do Vínculo
            </label>
            <select
              value={formData.deviceStatus}
              onChange={(e) => setFormData({ ...formData, deviceStatus: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="UNLINKED">Não vinculado</option>
              <option value="PENDING">Aguardando confirmação</option>
              <option value="LINKED">Vinculado</option>
              <option value="REVOKED">Revogado</option>
            </select>
          </div>
        </div>
      )}

      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Ao criar um novo usuário, um email será enviado com instruções para definir a senha.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          isLoading={createUser.isPending || updateUser.isPending}
        >
          {user ? 'Salvar Alterações' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
};

export default Users;
