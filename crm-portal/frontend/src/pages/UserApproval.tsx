import React, { useState } from 'react';
import { CheckCircle, XCircle, UserCheck, UserX, Clock, Shield, Loader2 } from 'lucide-react';
import { usePendingUsers, useApproveUser, useRejectUser } from '@/hooks/useAuth';
import { Button, Card, Badge, Modal } from '@/components/ui';
import toast from 'react-hot-toast';
import type { UserRole } from '@/types';

export const UserApproval: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('PARTNER');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingUsers, isLoading } = usePendingUsers();
  const approveMutation = useApproveUser();
  const rejectMutation = useRejectUser();

  const handleApprove = () => {
    if (!selectedUser) return;

    approveMutation.mutate(
      { userId: selectedUser.id, role: selectedRole },
      {
        onSuccess: () => {
          toast.success('Usuário aprovado com sucesso!');
          setShowApproveModal(false);
          setSelectedUser(null);
        },
        onError: () => {
          toast.error('Erro ao aprovar usuário');
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedUser) return;

    rejectMutation.mutate(
      { userId: selectedUser.id, reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success('Usuário rejeitado');
          setShowRejectModal(false);
          setSelectedUser(null);
          setRejectionReason('');
        },
        onError: () => {
          toast.error('Erro ao rejeitar usuário');
        },
      }
    );
  };

  const roleLabels: Record<UserRole, string> = {
    PARTNER: 'Sucateiro Parceiro',
    BUYER: 'Comprador',
    ANALYST: 'Analista',
    MANAGER: 'Gerente',
    DIRECTOR: 'Diretor',
    INTEL_COORDINATOR: 'Coordenador de Inteligência',
    ADMIN: 'Administrador',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprovação de Usuários</h1>
          <p className="text-gray-500 mt-1">
            Gerencie os cadastros pendentes de aprovação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {pendingUsers?.length || 0} pendentes
          </Badge>
        </div>
      </div>

      {/* Lista de usuários pendentes */}
      {pendingUsers && pendingUsers.length > 0 ? (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {user.cpf && (
                        <span>CPF: {user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                      )}
                      {user.phone && <span>Tel: {user.phone}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Cadastrado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRejectModal(true);
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowApproveModal(true);
                    }}
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Aprovar
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum usuário pendente
          </h3>
          <p className="text-gray-500">
            Todos os cadastros foram analisados e processados.
          </p>
        </Card>
      )}

      {/* Modal de Aprovação */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Aprovar Usuário"
      >
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <UserCheck className="w-5 h-5" />
              <span className="font-medium">Aprovar: {selectedUser?.name}</span>
            </div>
            <p className="text-sm text-green-700 mt-1">{selectedUser?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perfil do Usuário
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Escolha o perfil de acesso adequado para este usuário.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowApproveModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApprove}
              isLoading={approveMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Confirmar Aprovação
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Rejeição */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Rejeitar Usuário"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <UserX className="w-5 h-5" />
              <span className="font-medium">Rejeitar: {selectedUser?.name}</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{selectedUser?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo da Rejeição (opcional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Informe o motivo da rejeição..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Este motivo será enviado ao usuário por email.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Confirmar Rejeição
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
