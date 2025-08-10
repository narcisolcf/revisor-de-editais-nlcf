# Landing Page Components

Esta pasta contém os componentes para a landing page do GovDocs, convertidos de HTML/Tailwind para React/TypeScript.

## Componentes

### Header.tsx
- Cabeçalho de navegação com logo, menu e botão de CTA
- Props: `onRequestAnalysis?: () => void`
- Inclui avatar do usuário (imagem configurável via variável)

### HeroSection.tsx  
- Seção hero principal com título, subtítulo e botão
- Props: `onRequestFreeAnalysis?: () => void`
- Background image configurável via variável
- Responsivo com container queries (@[480px])

### Stats.tsx
- Cards de estatísticas (Documentos Revisados, Órgãos Atendidos)
- Props: `documentsReviewed?: string`, `agenciesServed?: string`
- Valores padrão: "1,500+" e "50+"

### Services.tsx
- Lista de serviços principais com imagem e descrição
- Props: `services?: Array<{category, title, description, imageUrl}>`
- 3 serviços padrão incluídos
- Imagens configuráveis via props ou variáveis

### CallToAction.tsx
- Seção final de chamada para ação
- Props: `title?, description?, buttonText?, onRequestAnalysis?`
- Texto completamente customizável via props

### Footer.tsx
- Rodapé com links, redes sociais e copyright
- Props: `links?, socialLinks?, copyrightText?`
- Ícones SVG para Twitter, Facebook, Instagram
- Links e textos customizáveis

## Página Principal

### LandingPage.tsx
- Componente principal que organiza todos os sub-componentes
- Props: `onRequestAnalysis?: () => void`
- Passa callbacks para todos os botões de CTA
- Inclui fonte personalizada (Public Sans, Noto Sans)

## Customização

### Imagens
Para substituir as imagens placeholder, edite as variáveis no topo de cada arquivo:
- `userAvatarUrl` (Header.tsx)
- `heroBackgroundUrl` (HeroSection.tsx)  
- `service1ImageUrl, service2ImageUrl, service3ImageUrl` (Services.tsx)

### Callbacks
Todos os botões de CTA podem ser customizados passando funções via props:
- Header: `onRequestAnalysis`
- HeroSection: `onRequestFreeAnalysis` 
- CallToAction: `onRequestAnalysis`
- LandingPage: `onRequestAnalysis` (propaga para todos os filhos)

### Conteúdo
A maioria dos textos pode ser customizada via props, com valores padrão sensatos já definidos.

## Roteamento

A landing page foi configurada como rota principal ("/") no App.tsx, substituindo o redirect para "/login".