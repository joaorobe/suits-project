-- Script de dados de teste para Suits - Sistema de Costura

-- Limpar dados antigos (CUIDADO: Remove tudo)
-- TRUNCATE TABLE tailor_orders CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE inventory CASCADE;

-- Inserir usuários
INSERT INTO users (id, cpf, password, name, role)
VALUES
  ('user-admin-1', '123.456.789-10', 'senha123', 'Alfaiate Marcus', 'admin'),
  ('user-costureira-1', '111.222.333-44', 'senha123', 'Costureira Gladimir', 'costureira'),
  ('user-costureira-2', '555.666.777-88', 'senha123', 'Costureira Maria', 'costureira')
ON CONFLICT (id) DO NOTHING;

-- Inserir trajes no inventário
INSERT INTO inventory (id, title, subtitle, sku, status, size, color, location, stock, image, action, price_category, price)
VALUES
  ('743G', 'Midnight Black', 'Paletó e calça', 'INV-743G', 'Disponível', 42, 'Black', 'Estoque Central', 1, '/terno1.jpg', 'Reservar Traje', 'Terno novo', 290.00),
  ('744H', 'Charcoal Grey', 'Paletó e calça', 'INV-744H', 'Costureira', 42, 'Cinza', 'Oficina A', 1, '/terno1.jpg', 'Editar Status', 'Terno novo', 290.00),
  ('745J', 'Navy Blue', 'Paletó e calça', 'INV-745J', 'Alugado', 40, 'Azul', 'Retirado', 0, '/terno1.jpg', 'Ver Pedido', 'Terno novo', 280.00),
  ('746K', 'Midnight Black', 'Paletó e calça', 'INV-746K', 'Lavanderia', 44, 'Black', 'Lavanderia', 0, '/terno1.jpg', 'Ver Pedido', 'Terno novo', 290.00),
  ('750M', 'Forest Green', 'Paletó e calça', 'INV-750M', 'Disponível', 38, 'Verde', 'Estoque Central', 1, '/terno1.jpg', 'Reservar Traje', 'Terno novo', 320.00)
ON CONFLICT (id) DO NOTHING;

-- Inserir pedidos de costura
INSERT INTO tailor_orders (id, inventory_id, assigned_to, adjustment_type, description, measurements, status, notes, created_at, updated_at)
VALUES
  ('TAO-20250102-001', '744H', 'user-costureira-1', 'Ajuste de Manga', 'Encurtar mangas em 2cm e ajustar ombro', 'MB: 62cm, Comprimento: 75cm, Ombro: 48cm', 'Novo', 'Cliente urgente - evento sábado', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TAO-20250102-002', '745J', 'user-costureira-1', 'Acinturamento', 'Afinar cintura em 1.5cm e ajustar comprimento', 'Cintura: 82cm, Comprimento: 78cm', 'Iniciado', 'Começou o acinturamento ontem', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
  ('TAO-20250102-003', '746K', 'user-costureira-2', 'Ajuste Completo', 'Ajuste geral de ombro, manga e comprimento', 'Ombro: 46cm, Manga: 65cm, Comprimento: 76cm', 'Novo', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TAO-20250101-001', '743G', 'user-costureira-1', 'Corte de Barra', 'Cortar calça com barra reta, 2cm mais curta', 'Comprimento: 80cm', 'Finalizado', 'Pronto para entrega - verificado pelo alfaiate', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  ('TAO-20250101-002', '750M', 'user-costureira-2', 'Ajuste de Ombro', 'Reticar ombro e dar mais caimento no braço', 'Ombro: 44cm, Axila: 58cm', 'Novo', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Consultas úteis para testar
-- SELECT * FROM users WHERE role = 'costureira';
-- SELECT * FROM tailor_orders ORDER BY created_at DESC;
-- SELECT * FROM tailor_orders WHERE assigned_to = 'user-costureira-1';
-- SELECT COUNT(*) as total_pedidos FROM tailor_orders;
-- SELECT status, COUNT(*) FROM tailor_orders GROUP BY status;
