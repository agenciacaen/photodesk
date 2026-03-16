-- 1. Tabelas Principais

CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE, -- Referência ao auth.users(id)
  nome_studio     TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  url_site        TEXT,
  webhook_url     TEXT,
  webhook_secret  TEXT,
  plano           TEXT NOT NULL DEFAULT 'basico'
                  CHECK (plano IN ('basico','pro','ilimitado')),
  limite_fotos_mes INTEGER DEFAULT 200,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ensaios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id       UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  slug             TEXT NOT NULL,
  categoria        TEXT NOT NULL,
  descricao        TEXT,
  capa_url         TEXT,
  status           TEXT NOT NULL DEFAULT 'rascunho'
                   CHECK (status IN ('rascunho','publicando','publicado','erro')),
  total_fotos      INTEGER DEFAULT 0,
  webhook_status   TEXT,
  webhook_payload  JSONB,
  webhook_response JSONB,
  criado_em        TIMESTAMPTZ DEFAULT NOW(),
  publicado_em     TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS ensaios_cliente_slug_idx ON ensaios(cliente_id, slug);

CREATE TABLE IF NOT EXISTS fotos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensaio_id     UUID NOT NULL REFERENCES ensaios(id) ON DELETE CASCADE,
  cliente_id    UUID NOT NULL REFERENCES clientes(id),
  storage_path  TEXT NOT NULL,
  url_publica   TEXT NOT NULL,
  url_thumb     TEXT,
  tamanho_bytes BIGINT,
  largura       INTEGER,
  altura        INTEGER,
  ordem         INTEGER DEFAULT 0,
  eh_capa       BOOLEAN DEFAULT false,
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  ensaio_id   UUID REFERENCES ensaios(id),
  titulo      TEXT,
  arquivada   BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Função Auxiliar Multitenancy

CREATE OR REPLACE FUNCTION get_cliente_id() RETURNS UUID AS $$
  SELECT id FROM public.clientes WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Row Level Security (RLS)

ALTER TABLE clientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensaios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas para Clientes
CREATE POLICY "admin_all" ON clientes FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "cliente_select_own" ON clientes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cliente_update_own" ON clientes FOR UPDATE USING (user_id = auth.uid());

-- Políticas para Ensaios
CREATE POLICY "admin_all" ON ensaios FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "cliente_select" ON ensaios FOR SELECT USING (cliente_id = get_cliente_id());
CREATE POLICY "cliente_insert" ON ensaios FOR INSERT WITH CHECK (cliente_id = get_cliente_id());
CREATE POLICY "cliente_update" ON ensaios FOR UPDATE USING (cliente_id = get_cliente_id());
CREATE POLICY "cliente_delete" ON ensaios FOR DELETE USING (cliente_id = get_cliente_id());

-- Políticas para Fotos
CREATE POLICY "admin_all" ON fotos FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "cliente_select" ON fotos FOR SELECT USING (cliente_id = get_cliente_id());
CREATE POLICY "cliente_insert" ON fotos FOR INSERT WITH CHECK (cliente_id = get_cliente_id());
CREATE POLICY "cliente_update" ON fotos FOR UPDATE USING (cliente_id = get_cliente_id());
CREATE POLICY "cliente_delete" ON fotos FOR DELETE USING (cliente_id = get_cliente_id());

-- Políticas para Conversas
CREATE POLICY "admin_all" ON conversas FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "cliente_select" ON conversas FOR SELECT USING (cliente_id = get_cliente_id());
CREATE POLICY "cliente_insert" ON conversas FOR INSERT WITH CHECK (cliente_id = get_cliente_id());
CREATE POLICY "cliente_update" ON conversas FOR UPDATE USING (cliente_id = get_cliente_id());

-- Políticas para Mensagens
CREATE POLICY "admin_all" ON mensagens FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
CREATE POLICY "cliente_select" ON mensagens FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversas WHERE id = mensagens.conversa_id AND cliente_id = get_cliente_id())
);
CREATE POLICY "cliente_insert" ON mensagens FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM conversas WHERE id = mensagens.conversa_id AND cliente_id = get_cliente_id())
);

-- 4. Storage Policies

-- fotos-ensaios (Público para leitura, restrito para escrita)
CREATE POLICY "fotos_leitura" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-ensaios');

CREATE POLICY "fotos_escrita" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-ensaios' AND
    (storage.foldername(name))[1] = (SELECT slug FROM clientes WHERE user_id = auth.uid())
  );

-- uploads-temp (Privado)
CREATE POLICY "temp_leitura" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads-temp' AND
    (storage.foldername(name))[1] = (SELECT id::text FROM clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "temp_escrita" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads-temp' AND
    (storage.foldername(name))[1] = (SELECT id::text FROM clientes WHERE user_id = auth.uid())
  );
