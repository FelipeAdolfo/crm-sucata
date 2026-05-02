/**
 * Configuracao da API
 * 
 * Em producao (Railway), VITE_API_URL deve ser a URL completa do backend:
 * Exemplo: https://crm-sucata-api.up.railway.app/api
 * 
 * Em desenvolvimento, usa o proxy do Vite (vite.config.ts)
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'CRM Sucata',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.MODE,
};
