# CRM Sucata - Aplicativo Mobile

Aplicativo mobile do CRM Sucata para Android e iOS. Desenvolvido com React Native e Expo.

## Funcionalidades

- **Dashboard** - Metricas, funil de vendas, oportunidades recentes
- **Oportunidades** - Lista completa com busca, detalhe com abas (Info, Contatos, Atividades)
- **Chamadas** - Registro automatico via app + historico completo com estatisticas
- **Visitas** - Agendamento e check-in GPS com validacao de proximidade
- **Documentos** - Upload, download e assinatura digital (canvas)
- **Configuracoes** - Perfil, redes sociais, dispositivo vinculado, logout

## Requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)

## Instalacao

```bash
cd mobile-app
npm install
```

## Executar em desenvolvimento

```bash
# Iniciar servidor Expo
npx expo start

# Executar no Android (emulador ou dispositivo)
npx expo start --android

# Executar no iOS (somente Mac)
npx expo start --ios
```

## Build para Producao

### Android APK (para distribuicao interna)

```bash
eas build --platform android --profile preview
```

### Android AAB (Google Play Store)

```bash
eas build --platform android --profile production
```

### iOS (App Store)

```bash
eas build --platform ios --profile production
```

## Configuracao da API

Edite o arquivo `src/services/api.ts` e atualize a variavel `API_BASE_URL` com o URL do seu backend no Railway:

```typescript
const API_BASE_URL = 'https://seu-backend.railway.app/api';
```

## Permissoes Android

O app requer as seguintes permissoes:

- **Localizacao (GPS)** - Para validacao de visitas
- **Telefone** - Para registro automatico de chamadas
- **Contatos** - Para identificar contatos nas chamadas
- **Camera** - Para fotos nas visitas
- **Armazenamento** - Para upload/download de documentos

## Estrutura do Projeto

```
mobile-app/
├── src/
│   ├── components/     # Componentes reutilizaveis
│   ├── hooks/          # Custom hooks
│   ├── navigation/     # Configuracao de navegacao
│   ├── screens/        # Telas do app
│   ├── services/       # Integracao com API
│   ├── store/          # Estado global (Zustand)
│   ├── types/          # Tipos TypeScript
│   └── utils/          # Utilitarios
├── App.tsx             # Entry point
├── app.json            # Configuracao Expo
├── eas.json            # Configuracao EAS Build
└── package.json
```

## Telas Implementadas

| Tela | Arquivo | Descricao |
|------|---------|-----------|
| Login | `LoginScreen.tsx` | Autenticacao JWT |
| Dashboard | `DashboardScreen.tsx` | Metricas e funil |
| Oportunidades | `OpportunitiesScreen.tsx` | Lista com filtros |
| Detalhe Oport. | `OpportunityDetailScreen.tsx` | Info, Contatos, Atividades |
| Chamadas | `CallsScreen.tsx` | Historico e estatisticas |
| Visitas | `VisitsScreen.tsx` | Check-in GPS |
| Documentos | `DocumentsScreen.tsx` | Upload, download, assinar |
| Assinatura | `DocumentSignScreen.tsx` | Canvas de assinatura |
| Configuracoes | `SettingsScreen.tsx` | Perfil, redes, device |

## Navegacao

- **Bottom Tabs**: Dashboard, Oportunidades, Chamadas, Visitas, Documentos, Configuracoes
- **Stack**: Login -> Main Tabs -> OpportunityDetail, DocumentSign
