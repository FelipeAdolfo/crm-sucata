import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, CreditCard, CheckCircle, ArrowLeft, Linkedin, Facebook, Instagram } from 'lucide-react';
import { useRegister } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: '',
    linkedinUrl: '',
    facebookUrl: '',
    instagramUrl: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const registerMutation = useRegister();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validação de CPF
  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    return true;
  };

  // Formatar CPF
  const formatCPF = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar telefone
  const formatPhone = (value: string): string => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('Mínimo 12 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Pelo menos um número');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Pelo menos um caractere especial');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      toast.error(`Senha inválida: ${passwordValidation.errors.join(', ')}`);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    // Limpar dados
    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : undefined,
      phone: formData.phone ? formData.phone.replace(/\D/g, '') : undefined,
      linkedinUrl: formData.linkedinUrl.trim() || undefined,
      facebookUrl: formData.facebookUrl.trim() || undefined,
      instagramUrl: formData.instagramUrl.trim() || undefined,
    };

    registerMutation.mutate(cleanData, {
      onSuccess: () => {
        setShowSuccess(true);
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Erro ao cadastrar';
        toast.error(message);
      },
    });
  };

  // Tela de sucesso
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro Realizado!
            </h2>
            <p className="text-gray-600 mb-6">
              Seu cadastro foi enviado e está aguardando aprovação do administrador.
              Você receberá uma notificação quando for aprovado.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar para login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-500 mt-1">
            Preencha seus dados para solicitar acesso
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome Completo *"
              name="name"
              type="text"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={handleChange}
              leftIcon={<User className="w-5 h-5" />}
              required
            />

            <Input
              label="Email *"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label="CPF"
              name="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => setFormData((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              leftIcon={<CreditCard className="w-5 h-5" />}
              maxLength={14}
            />

            <Input
              label="Telefone"
              name="phone"
              type="text"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: formatPhone(e.target.value) }))}
              leftIcon={<Phone className="w-5 h-5" />}
              maxLength={15}
            />

            <div>
              <Input
                label="Senha *"
                name="password"
                type="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />
              <ul className="mt-2 text-xs text-gray-500 space-y-1">
                <li className={formData.password.length >= 12 ? 'text-green-600' : ''}>
                  ✓ Mínimo 12 caracteres
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                  ✓ Pelo menos uma letra maiúscula
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                  ✓ Pelo menos uma letra minúscula
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  ✓ Pelo menos um número
                </li>
                <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  ✓ Pelo menos um caractere especial
                </li>
              </ul>
            </div>

            <Input
              label="Confirmar Senha *"
              name="confirmPassword"
              type="password"
              placeholder="••••••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Redes Sociais (opcional)
              </p>

              <Input
                label="LinkedIn"
                name="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/in/seu-perfil"
                value={formData.linkedinUrl}
                onChange={handleChange}
                leftIcon={<Linkedin className="w-5 h-5" />}
              />

              <Input
                label="Facebook"
                name="facebookUrl"
                type="url"
                placeholder="https://facebook.com/seu-perfil"
                value={formData.facebookUrl}
                onChange={handleChange}
                leftIcon={<Facebook className="w-5 h-5" />}
              />

              <Input
                label="Instagram"
                name="instagramUrl"
                type="url"
                placeholder="https://instagram.com/seu-perfil"
                value={formData.instagramUrl}
                onChange={handleChange}
                leftIcon={<Instagram className="w-5 h-5" />}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={registerMutation.isPending}
            >
              Criar Conta
            </Button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Ao se cadastrar, você concorda que seus dados serão analisados 
            pelo administrador antes da aprovação.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-8">
          © 2024 SucataLog. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};
