Com certeza! Você está seguindo nosso workflow perfeitamente.

Aqui está o conteúdo completo que você deve colar dentro do novo arquivo docs/features/novas_interfaces_e_formularios.md.

Este é o nosso "plano de construção" detalhado para o seu assistente de IA, o Cursor.

COLE O TEXTO ABAIXO DENTRO DO SEU ARQUIVO:

Markdown

# Feature: Expansão de Módulos com Novas Interfaces e Formulários

**Tarefa:** Expandir o escopo funcional do sistema, criando novas páginas para "Terceirização" e "Estágio", e implementando os formulários de CRUD correspondentes para estes e outros módulos existentes (`Concursos`, `Seleções`, `Relatórios`).

**Contexto:** Conforme nosso plano de ação, precisamos construir as interfaces de usuário para os módulos que ainda não as possuem, garantindo a consistência com nosso `DESIGN_SYSTEM.md`.

**Siga as Etapas Abaixo, em Ordem:**

### Etapa 1: Criar as Novas Páginas (Terceirização e Estágio)

**Objetivo:** Criar os arquivos de página para os novos módulos e adicioná-los à navegação do sistema.

**Instruções:**
1.  **Criar Páginas:** No diretório `src/pages/`, crie os dois seguintes arquivos:
    * `Terceirizacao.tsx`: Crie como um componente React básico que, por enquanto, exibe um título `<h1>Gestão de Terceirização</h1>`.
    * `Estagio.tsx`: Crie como um componente React básico que exibe um título `<h1>Gestão de Estágios</h1>`.
2.  **Adicionar Rotas:** No arquivo `src/App.tsx`, adicione as novas rotas para estas páginas (ex: `/terceirizacao` e `/estagio`), protegidas pela nossa `ProtectedRoute`.
3.  **Atualizar Menu Lateral:** No arquivo `src/config/navigation.ts`, adicione os novos itens de menu para "Terceirização" e "Estágio", associando-os aos ícones apropriados da biblioteca `lucide-react`.

### Etapa 2: Criar o Formulário para Processos Seletivos (`Concursos` e `Seleções`)

**Objetivo:** Criar um formulário para cadastrar e editar concursos e seleções.

**Instruções (Chain of Thought):**
1.  **Analise os Modelos:** Examine os arquivos `src/models/ConcursosModel.ts` e `src/models/SelecoesModel.ts` para identificar os campos necessários (ex: Título, Edital, Data de Início, Status, Vagas).
2.  **Crie o Componente:** Crie um novo arquivo `src/components/forms/ProcessoSeletivoForm.tsx`.
3.  **Implemente o Formulário:** Construa um formulário React robusto com todos os campos necessários para criar ou editar um processo seletivo. Utilize os componentes da nossa biblioteca de UI (`Input`, `Select`, `DatePicker`, etc.).
4.  **Integre:** Modifique as páginas `Concursos.tsx` e `Selecoes.tsx` para que o botão "Adicionar Novo" abra um `Dialog` contendo este novo formulário.

### Etapa 3: Criar o "Formulário" de Filtros para Relatórios

**Objetivo:** Criar uma interface de filtros para que o usuário possa gerar relatórios específicos.

**Instruções:**
1.  **Crie o Componente:** Crie um novo arquivo `src/components/reports/ReportFilters.tsx`.
2.  **Implemente a Interface:** Este componente será um painel de filtros. Adicione os seguintes controles:
    * `DatePicker` para selecionar um intervalo de datas (Início e Fim).
    * `Select` para escolher o tipo de relatório (ex: "Ficha Financeira de Servidor", "Relação de Vagas por Cargo").
    * Um campo de busca para selecionar um servidor ou cargo específico.
    * Um botão "Gerar Relatório".
3.  **Integre:** Adicione este componente `ReportFilters.tsx` no topo da página `Relatorios.tsx`.

### Etapa 4: Criar Formulários para Terceirização e Estágio

**Objetivo:** Construir os formulários de CRUD para os novos módulos.

**Instruções:**
1.  **Crie o Formulário de Contrato:** Crie o arquivo `src/components/forms/ContratoTerceirizadoForm.tsx`. Com base no nosso plano de backend, adicione os campos: `Empresa Contratada`, `CNPJ`, `Objeto do Contrato`, `Data de Início`, `Data de Fim`, `Valor Mensal`, `Status`.
2.  **Crie o Formulário de Estágio:** Crie o arquivo `src/components/forms/ConvenioEstagioForm.tsx`. Adicione campos relevantes como `Instituição de Ensino`, `Curso`, `Nome do Estagiário` (que pode ser um `Select` buscando da nossa base de servidores), `Data de Início`, `Data de Fim`, `Bolsa-Auxílio`.
3.  **Integre:** Modifique as novas páginas `Terceirizacao.tsx` e `Estagio.tsx` para que utilizem estes novos formulários em um `Dialog`, assim como fizemos para as outras páginas de CRUD.
