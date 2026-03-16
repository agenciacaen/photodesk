-- Seed Data para PhotoDesk

-- 1. Usuário Admin (Simulado via metadata, o usuário real deve ser criado no Auth)
-- Nota: Em sistemas reais, você usaria auth.users, aqui focamos nos dados do app.

-- 2. Clientes (Estúdios)
INSERT INTO clientes (id, user_id, nome_studio, slug, url_site, plano, limite_fotos_mes)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '00000000-0000-0000-0000-000000000001', 'Luz & Sombras', 'luz-e-sombras', 'https://luzesombras.com', 'pro', 500),
  ('b2c3d4e5-f6a7-4b6c-9d8e-1f2a3b4c5d6e', '00000000-0000-0000-0000-000000000002', 'Studio Aurora', 'studio-aurora', 'https://studioaurora.com', 'basico', 200);

-- 3. Ensaios para o Cliente 1 (Luz & Sombras)
INSERT INTO ensaios (cliente_id, titulo, slug, categoria, descricao, status, total_fotos, capa_url)
VALUES 
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Casamento Mariana & Pedro', 'casamento-mariana-pedro', 'casamento', 'Uma cerimônia emocionante no campo.', 'publicado', 45, 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Newborn Baby Alice', 'newborn-baby-alice', 'newborn', 'Primeiros dias da pequena Alice.', 'publicado', 20, 'https://images.unsplash.com/photo-1519689680058-324335c77eba'),
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Ensaio Gestante - Helena', 'gestante-helena', 'gestante', 'Fotos na praia ao pôr do sol.', 'rascunho', 15, 'https://images.unsplash.com/photo-1559599101-f09722fb4948');
