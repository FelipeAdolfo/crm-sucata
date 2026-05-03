import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Clock, XCircle } from 'lucide-react';
import { useLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';
import type { AuthError } from '@/types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  
  const { pendingApproval, approvalMessage } = useAuthStore();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          if (data.token) {
            toast.success('Login realizado com sucesso!');
            navigate('/dashboard');
          }
        },
        onError: (err: any) => {
          const errorData = err.response?.data as AuthError;
          setError(errorData);
          
          // Tratar erros específicos
          switch (errorData?.code) {
            case 'PENDING_APPROVAL':
              toast.error('Cadastro aguardando aprovação');
              break;
            case 'REJECTED':
              toast.error('Cadastro rejeitado');
              break;
            case 'SUSPENDED':
              toast.error('Conta suspensa');
              break;
            case 'ACCOUNT_LOCKED':
              toast.error('Conta temporariamente bloqueada');
              break;
            case 'INVALID_CREDENTIALS':
              toast.error('Email ou senha incorretos');
              break;
            default:
              toast.error(errorData?.error || 'Erro ao fazer login');
          }
        },
      }
    );
  };

  const isLoading = loginMutation.isPending;

  // Renderizar mensagem de erro específica
  const renderErrorMessage = () => {
    if (!error) return null;

    const errorConfig: Record<string, { icon: React.ReactNode; title: string; color: string }> = {
      PENDING_APPROVAL: {
        icon: <Clock className="w-12 h-12 text-yellow-500" />,
        title: 'Aguardando Aprovação',
        color: 'yellow',
      },
      REJECTED: {
        icon: <XCircle className="w-12 h-12 text-red-500" />,
        title: 'Cadastro Rejeitado',
        color: 'red',
      },
      SUSPENDED: {
        icon: <AlertCircle className="w-12 h-12 text-orange-500" />,
        title: 'Conta Suspensa',
        color: 'orange',
      },
      ACCOUNT_LOCKED: {
        icon: <Lock className="w-12 h-12 text-red-500" />,
        title: 'Conta Bloqueada',
        color: 'red',
      },
    };

    const config = errorConfig[error.code];
    if (!config) return null;

    return (
      <div className={`mt-4 p-4 bg-${config.color}-50 border border-${config.color}-200 rounded-lg`}>
        <div className="flex flex-col items-center text-center">
          {config.icon}
          <h3 className={`mt-2 text-lg font-semibold text-${config.color}-800`}>
            {config.title}
          </h3>
          <p className={`mt-1 text-sm text-${config.color}-700`}>
            {error.error}
          </p>
          {error.lockedUntil && (
            <p className={`mt-2 text-xs text-${config.color}-600`}>
              Desbloqueio em: {new Date(error.lockedUntil).toLocaleString('pt-BR')}
            </p>
          )}
          {error.attemptsRemaining !== undefined && (
            <p className={`mt-2 text-xs text-${config.color}-600`}>
              Tentativas restantes: {error.attemptsRemaining}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Se estiver pendente de aprovação, mostrar tela específica
  if (pendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Portal Sucata</h1>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aguardando Aprovação
            </h2>
            <p className="text-gray-600 mb-4">
              {approvalMessage || 'Seu cadastro está sendo analisado pelo administrador.'}
            </p>
            <p className="text-sm text-gray-500">
              Você receberá uma notificação quando for aprovado.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                useAuthStore.getState().clearPendingApproval();
                setError(null);
              }}
            >
              Voltar ao Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Sucata</h1>
          <p className="text-gray-500 mt-1">CRM de Negócios e Inteligência de Mercado</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Entrar
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5" />}
              required
              autoComplete="email"
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
            >
              Entrar
            </Button>
          </form>

          {/* Mensagem de erro */}
          {renderErrorMessage()}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Primeiro acesso?{' '}
              <a href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Cadastre-se
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2024 SucataLog. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
