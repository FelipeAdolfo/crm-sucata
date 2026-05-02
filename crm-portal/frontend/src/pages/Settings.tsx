import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Smartphone,
  Save,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  QrCode,
  Download,
  Linkedin,
  Facebook,
  Instagram,
  Unlink,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/auth';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Gerencie suas preferências e segurança</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-4 lg:col-span-1 h-fit">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Perfil</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'security' 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-medium">Segurança</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="font-medium">Notificações</span>
            </button>
          </nav>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
        </div>
      </div>
    </div>
  );
};

// Profile Settings
const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    linkedinUrl: user?.linkedinUrl || '',
    facebookUrl: user?.facebookUrl || '',
    instagramUrl: user?.instagramUrl || '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.patch('/users/profile', data);
      return response;
    },
    onSuccess: (data) => {
      setUser({ ...user!, ...data });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setSuccessMessage('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-3xl font-medium text-primary-600">
            {user?.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
          <p className="text-gray-500">{user?.email}</p>
          <Badge className="mt-2">
            {user?.role === 'PARTNER' ? 'Sócio' :
             user?.role === 'DIRECTOR' ? 'Diretor' :
             user?.role === 'MANAGER' ? 'Gerente' :
             user?.role === 'INTEL_COORDINATOR' ? 'Coord. Inteligência' :
             user?.role === 'BUYER' ? 'Comprador' :
             user?.role === 'ANALYST' ? 'Analista' : user?.role}
          </Badge>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-success-50 border border-success-200 rounded-lg flex items-center gap-2 text-success-700">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Redes Sociais */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Redes Sociais (para automacao de captura de contatos)
          </h4>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                LinkedIn
              </label>
              <Input
                value={formData.linkedinUrl}
                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                placeholder="https://linkedin.com/in/seu-perfil"
                leftIcon={<Linkedin className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Facebook
              </label>
              <Input
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/seu-perfil"
                leftIcon={<Facebook className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Instagram
              </label>
              <Input
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                placeholder="https://instagram.com/seu-perfil"
                leftIcon={<Instagram className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Dispositivo Conectado */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Dispositivo Celular Conectado
          </h4>
          {user?.deviceStatus === 'LINKED' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Dispositivo vinculado
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {user.deviceModel || 'Android'} — ID: {user.deviceId?.slice(0, 12)}...
                  </p>
                  {user.deviceLinkedAt && (
                    <p className="text-xs text-green-500 mt-0.5">
                      Vinculado em {new Date(user.deviceLinkedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Unlink className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Nenhum dispositivo vinculado
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instale o app Android e realize o primeiro login para vincular automaticamente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button 
            type="submit" 
            isLoading={updateProfile.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Alteracoes
          </Button>
        </div>
      </form>
    </Card>
  );
};

// Security Settings
const SecuritySettings: React.FC = () => {
  const { user } = useAuthStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const changePassword = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.post('/auth/change-password', data);
      return response;
    },
  });

  const setupTwoFactor = useQuery({
    queryKey: ['2fa-setup'],
    queryFn: async () => {
      const { data } = await api.post('/auth/2fa/setup');
      return data;
    },
    enabled: showTwoFactorSetup && !user?.twoFactorEnabled,
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Alterar Senha</h3>
              <p className="text-sm text-gray-500">Atualize sua senha de acesso</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? 'Cancelar' : 'Alterar'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <Input
                  type={showPassword.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                isLoading={changePassword.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Nova Senha
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Two Factor Authentication */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Autenticação de Dois Fatores</h3>
              <p className="text-sm text-gray-500">Adicione uma camada extra de segurança</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.twoFactorEnabled ? (
              <Badge className="bg-success-100 text-success-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            ) : (
              <Badge variant="outline">Inativo</Badge>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowTwoFactorSetup(!showTwoFactorSetup)}
            >
              {user?.twoFactorEnabled ? 'Gerenciar' : 'Configurar'}
            </Button>
          </div>
        </div>

        {showTwoFactorSetup && !user?.twoFactorEnabled && (
          <div className="mt-4 pt-4 border-t">
            {setupTwoFactor.isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : setupTwoFactor.data ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Escaneie o QR Code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <QrCode className="w-48 h-48" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ou digite a chave manualmente:
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      value={setupTwoFactor.data.secret} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button variant="outline">
                      Copiar
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Verificação
                  </label>
                  <Input 
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTwoFactorSetup(false)}>
                    Cancelar
                  </Button>
                  <Button>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ativar 2FA
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {user?.twoFactorEnabled && (
          <div className="mt-4 pt-4 border-t">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <p className="font-medium text-success-700">2FA está ativo</p>
                <p className="text-sm text-success-600 mt-1">
                  Sua conta está protegida com autenticação de dois fatores.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" className="text-danger-600 border-danger-200 hover:bg-danger-50">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Desativar 2FA
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Session Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Sessão Atual</h3>
            <p className="text-sm text-gray-500">Informações sobre sua sessão</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Último login</span>
            <span className="text-gray-900">
              {user?.lastLoginAt 
                ? new Date(user.lastLoginAt).toLocaleString('pt-BR')
                : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">IP Address</span>
            <span className="text-gray-900 font-mono">192.168.1.1</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">Navegador</span>
            <span className="text-gray-900">Chrome / Windows</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Notification Settings
const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    emailVisits: true,
    emailStageChanges: true,
    emailNewOpportunities: false,
    emailReports: true,
    pushVisits: true,
    pushStageChanges: false,
    pushNewOpportunities: true,
    smsUrgent: false,
  });

  const queryClient = useQueryClient();

  const saveSettings = useMutation({
    mutationFn: async (data: any) => {
      const { data: response } = await api.patch('/users/notifications', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferências de Notificação</h3>

      <div className="space-y-8">
        {/* Email Notifications */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            Email
          </h4>
          <div className="space-y-3 ml-10">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Lembretes de visitas</span>
              <input
                type="checkbox"
                checked={settings.emailVisits}
                onChange={() => handleToggle('emailVisits')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Mudanças de fase</span>
              <input
                type="checkbox"
                checked={settings.emailStageChanges}
                onChange={() => handleToggle('emailStageChanges')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Novas oportunidades</span>
              <input
                type="checkbox"
                checked={settings.emailNewOpportunities}
                onChange={() => handleToggle('emailNewOpportunities')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Relatórios semanais</span>
              <input
                type="checkbox"
                checked={settings.emailReports}
                onChange={() => handleToggle('emailReports')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-600" />
            </div>
            Push (App)
          </h4>
          <div className="space-y-3 ml-10">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Lembretes de visitas</span>
              <input
                type="checkbox"
                checked={settings.pushVisits}
                onChange={() => handleToggle('pushVisits')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Mudanças de fase</span>
              <input
                type="checkbox"
                checked={settings.pushStageChanges}
                onChange={() => handleToggle('pushStageChanges')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Novas oportunidades</span>
              <input
                type="checkbox"
                checked={settings.pushNewOpportunities}
                onChange={() => handleToggle('pushNewOpportunities')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-purple-600" />
            </div>
            SMS
          </h4>
          <div className="space-y-3 ml-10">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-700">Alertas urgentes apenas</span>
              <input
                type="checkbox"
                checked={settings.smsUrgent}
                onChange={() => handleToggle('smsUrgent')}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 mt-6 border-t">
        <Button 
          onClick={() => saveSettings.mutate(settings)}
          isLoading={saveSettings.isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Preferências
        </Button>
      </div>
    </Card>
  );
};

export default Settings;
