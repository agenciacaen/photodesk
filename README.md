# 📸 PhotoDesk

O **PhotoDesk** é um Dashboard inteligente construído para fotógrafos gerenciarem e publicarem seus ensaios através de um Assistente de Inteligência Artificial usando a stack de ponta: Next.js 14, Supabase (PostgreSQL + Auth + Storage) e OpenAI.

---

## 🚀 Setup Local

1. **Clone o repositório** e instale as dependências:
   ```bash
   git clone [URL_DO_REPO] photodesk
   cd photodesk
   npm install
   ```

2. **Crie o arquivo `.env.local`** na raiz do projeto contendo as seguintes chaves de ambiente:
   ```env
   # Frontend Auth e DB (Expostos com Segurança)
   NEXT_PUBLIC_SUPABASE_URL=https://[ID_AQUI].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz... # Chave anon/public padrão
   
   # Backend Privado
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz... # Chave Service Role (NUNCA vaze)
   
   # IA Integrações
   OPENAI_API_KEY=sk-... 
   ```

3. **Inicie o Ambiente de Desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 🗄️ Supabase Migrations (Banco de Dados)

Execute as seguintes queries SQL no Editor SQL do seu projeto Supabase para configurar as Tabelas base de Multi-Tenancy (Estúdios isolados) e ativar as RLS.

```sql
-- TABELAS
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_studio TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  url_site TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  plano TEXT NOT NULL DEFAULT 'basico' CHECK (plano IN ('basico','pro','ilimitado')),
  limite_fotos_mes INTEGER DEFAULT 200,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ensaios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  capa_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicando','publicado','erro','removido')),
  total_fotos INTEGER DEFAULT 0,
  webhook_status TEXT,
  webhook_payload JSONB,
  webhook_response JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  publicado_em TIMESTAMPTZ
);
CREATE UNIQUE INDEX ON ensaios(cliente_id, slug);

CREATE TABLE fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ensaio_id UUID NOT NULL REFERENCES ensaios(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  storage_path TEXT NOT NULL,
  url_publica TEXT NOT NULL,
  url_thumb TEXT,
  tamanho_bytes BIGINT,
  largura INTEGER,
  altura INTEGER,
  ordem INTEGER DEFAULT 0,
  eh_capa BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) e Isolamento
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ensaios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_cliente_id() RETURNS UUID AS $$
  SELECT id FROM clientes WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Exemplo Policy para Ensaios (Replicar para as demais focando isolamento + admin liberado)
CREATE POLICY "cliente_all" ON ensaios FOR ALL USING (cliente_id = get_cliente_id());
CREATE POLICY "admin_all" ON ensaios FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');

-- Storage (fotos-ensaios public e uploads-temp privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-ensaios', 'fotos-ensaios', true);
CREATE POLICY "fotos_leitura" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-ensaios');
CREATE POLICY "fotos_escrita" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'fotos-ensaios' AND 
    (storage.foldername(name))[1] = (SELECT slug FROM clientes WHERE user_id = auth.uid())
);
```

---

## 👑 Criação do Primeiro Super Admin

Por padrão, a tela `app/api/admin/clientes` exige permissão `admin`. Para criarmos o primeiro, você deve inserir pelo SQL:

```sql
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES 
('UID_GERADO_AQUI', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'master@photodesk.com', crypt('SENHA_FORTE_AQUI', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{"role": "admin"}', false);
```

*(Dica: Se preferir, crie um usuário comum no Painel UI do Supabase, e logo depois atualize seu JSON de raw_user_meta_data injetando a claim `{"role": "admin"}`).*

Ao Logar pela tela normal (`/login`) você será redirecionado automaticamente à dashboard de Admin via validação de Rota, habilitado a criar ilimitados fotógrafos daquele ponto em diante via Interface sem precisar tocar no SQL de novo.

---

## 🖇️ Guia de Integração Webhook (Sites dos Clientes)

O servidor do cliente (WordPress, Next, etc) precisa receber POST Requests na URL gravada no DB sob validação de assinatura para rejeitar SPAMS/falsificações.

O Payload postado pela IA quando o fotógrafo pedir as publicações é:
```json
{
  "ensaio": { /* dados como slug, titulo, categoria e capa */ },
  "fotos": [ /* lista extraída das aprovadas na IA */ ]
}
```

Espera-se que o Backend do Fotógrafo (Endpoint Webhook Receiver) implemente isto em TS/JS Node como validação:

```javascript
import crypto from 'crypto'

export function verificarWebhook(bodyText, signature, secret) {
  // bodyText = payload JSON stringificado recebido
  // signature = req.headers['x-photodesk-signature']
  // secret = chave visível no perfil /clientes/[id] do Admin
  
  const expected = `sha256=${crypto
    .createHmac('sha256', secret)
    .update(bodyText) // Opcionalmente, pode assinar com Timestamp: ${ts}.${bodyText} para mitigar Replay Attacks
    .digest('hex')}`;
    
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

Se `true`, basta publicar as Fotos no Site correspondente!
