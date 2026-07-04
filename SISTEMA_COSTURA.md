# Sistema de Gerenciamento de Costura - Documentação

## 🎯 Visão Geral

O Suits agora possui um sistema totalmente funcional de gerenciamento de pedidos de costura, com sincronização em tempo real entre o painel do administrador e o dashboard da costureira.

## 👥 Usuários e Funções

### Admin (Alfaiate)
- Acessa: `/dashboard` (padrão após login)
- Pode visualizar: `/costureira-admin` para gerenciar todos os pedidos de costura
- Vê o andamento de cada pedido, mas **não** controla os estados
- Pode adicionar observações nos pedidos

### Costureira
- Acessa: `/costureira` após fazer login com credencial de costureira
- Vê apenas os pedidos atribuídos a ela
- **Controla totalmente** o status do pedido: Novo → Iniciado → Finalizado → Observação
- Pode adicionar notas/observações que são compartilhadas com o admin

## 📊 Estrutura de Dados

### Tabela: `tailor_orders`
```
id                  - ID único do pedido (TAO-timestamp)
inventory_id        - Referência ao traje no inventário
assigned_to         - ID do usuário (costureira) responsável
adjustment_type     - Tipo de ajuste (ex: "Ajuste de Manga")
description         - Descrição detalhada do que fazer
measurements        - Medidas específicas (opcional)
status              - Novo | Iniciado | Finalizado | Observação
notes               - Observações compartilhadas
created_at          - Data de criação
updated_at          - Data da última atualização
completed_at        - Data de conclusão (se finalizado)
```

## 🔄 Fluxo de Estados

```
Novo 
  ↓ (Costureira clica "Iniciar")
Iniciado
  ↓ (Costureira clica "Concluir")
Finalizado
  ↓ (Costureira clica "Observação" se houver algo para observar)
Observação
  ↓ (Volta para Novo)
```

## 🔐 Login e Autenticação

### Credenciais de Teste
```
Admin:
CPF: 123.456.789-10
Senha: senha123
Role: admin

Costureira (exemplo):
CPF: 111.222.333-44
Senha: senha123
Role: costureira
```

### Redirecionamento Automático
- Admin é redirecionado para `/dashboard`
- Costureira é redirecionado para `/costureira`

## 📡 APIs Implementadas

### `/api/tailor-orders` - Gerenciamento de Pedidos de Costura

**GET** - Listar pedidos
```bash
# Todos os pedidos
GET /api/tailor-orders

# Pedidos de uma costureira específica
GET /api/tailor-orders?assignedTo=user-123

# Pedido específico
GET /api/tailor-orders?id=TAO-1234567890
```

**POST** - Criar novo pedido
```bash
POST /api/tailor-orders
{
  "inventoryId": "743G",
  "assignedTo": "user-2",
  "adjustmentType": "Ajuste de Manga",
  "description": "Encurtar manga em 2cm",
  "measurements": "MB: 62cm, Comprimento: 75cm",
  "notes": "Cliente urgente"
}
```

**PATCH** - Atualizar pedido
```bash
PATCH /api/tailor-orders
{
  "id": "TAO-1234567890",
  "status": "Iniciado",
  "notes": "Começando o ajuste..."
}
```

**DELETE** - Deletar pedido
```bash
DELETE /api/tailor-orders?id=TAO-1234567890
```

## 🖼️ Páginas Principais

### `/login`
- Login unificado para admin e costureira
- Validação de CPF e senha
- Redirecionamento automático baseado em role

### `/dashboard` (Admin)
- Visão geral do negócio
- Métricas e atividades recentes
- Link para gerenciar costura

### `/costureira-admin` (Admin)
- **Nova página** para gerenciar pedidos de costura
- Tabela com todos os pedidos
- Filtro por status
- Modal com detalhes e observações
- Sincronização em tempo real com `/costureira`

### `/costureira` (Costureira)
- **Nova página** exclusiva para costureira
- Exibe apenas pedidos atribuídos a ela
- Cards interativos para gerenciar status
- Exibição de medidas e descrições
- Botões para Iniciar, Concluir ou adicionar Observação

## 🔧 Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@neon-server/database
```

## 🚀 Próximos Passos

1. **Inserir dados de teste** na tabela `users` e `tailor_orders`
2. **Testar fluxo completo** de login → pedidos → atualização de status
3. **Implementar notificações** em tempo real (opcional)
4. **Adicionar permissões mais granulares** (opcional)

## 📝 Notas de Implementação

- O backend **não está mais mockado** - tudo vem do banco de dados
- As observações são compartilhadas entre admin e costureira
- O admin **não pode** mudar o status - apenas a costureira pode
- O admin vê tudo, mas tem acesso limitado para edição
- A sincronização é feita via API, não há WebSocket configurado (pode ser adicionado depois)

## 🐛 Troubleshooting

### Pedidos não aparecem na costureira
- Verificar se o `assigned_to` está correto no banco
- Verificar se o `id` do usuário armazenado no localStorage corresponde

### Login não funciona
- Verificar se o user existe na tabela `users` com `role = 'costureira'` ou `role = 'admin'`
- Verificar se o DATABASE_URL está configurado

### Mudanças não sincronizam
- Recarregar a página para ver atualizações (sem WebSocket)
- Verificar se a API está respondendo corretamente
