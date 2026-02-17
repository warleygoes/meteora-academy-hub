import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Copy, Check, ExternalLink, Key, FileCode2, Shield, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/automation-api`;

interface ActionDoc {
  action: string;
  description: string;
  method: string;
  params: { name: string; type: string; required: boolean; description: string }[];
  response: string;
}

const actions: ActionDoc[] = [
  // ─── Users & Access ───
  {
    action: 'create_user',
    description: 'Cria um novo usuário com perfil completo.',
    method: 'POST',
    params: [
      { name: 'email', type: 'string', required: true, description: 'E-mail do usuário' },
      { name: 'password', type: 'string', required: true, description: 'Senha (mínimo 6 caracteres)' },
      { name: 'display_name', type: 'string', required: false, description: 'Nome de exibição' },
      { name: 'phone', type: 'string', required: false, description: 'Telefone' },
      { name: 'country', type: 'string', required: false, description: 'País' },
      { name: 'company_name', type: 'string', required: false, description: 'Empresa' },
      { name: 'approved', type: 'boolean', required: false, description: 'Aprovar automaticamente (padrão: true)' },
    ],
    response: '{ "success": true, "user_id": "uuid", "email": "user@mail.com" }',
  },
  {
    action: 'enroll_user',
    description: 'Inscreve um usuário em um curso específico.',
    method: 'POST',
    params: [
      { name: 'user_id', type: 'string', required: false, description: 'ID do usuário (ou use email)' },
      { name: 'email', type: 'string', required: false, description: 'E-mail do usuário (alternativa ao user_id)' },
      { name: 'course_id', type: 'string', required: true, description: 'ID do curso' },
    ],
    response: '{ "success": true, "already_enrolled": false, "enrollment_id": "uuid", "course_title": "..." }',
  },
  {
    action: 'assign_product',
    description: 'Atribui um produto a um usuário.',
    method: 'POST',
    params: [
      { name: 'user_id', type: 'string', required: false, description: 'ID do usuário (ou use email)' },
      { name: 'email', type: 'string', required: false, description: 'E-mail do usuário' },
      { name: 'product_id', type: 'string', required: true, description: 'ID do produto' },
    ],
    response: '{ "success": true, "already_assigned": false, "product_name": "..." }',
  },
  {
    action: 'assign_package',
    description: 'Atribui um pacote ativo a um usuário.',
    method: 'POST',
    params: [
      { name: 'user_id', type: 'string', required: false, description: 'ID do usuário (ou use email)' },
      { name: 'email', type: 'string', required: false, description: 'E-mail do usuário' },
      { name: 'package_id', type: 'string', required: true, description: 'ID do pacote' },
    ],
    response: '{ "success": true, "already_assigned": false, "package_name": "..." }',
  },
  // ─── Listagens ───
  { action: 'list_courses', description: 'Lista todos os cursos.', method: 'POST', params: [], response: '{ "courses": [...] }' },
  { action: 'list_products', description: 'Lista todos os produtos.', method: 'POST', params: [], response: '{ "products": [...] }' },
  { action: 'list_packages', description: 'Lista todos os pacotes.', method: 'POST', params: [], response: '{ "packages": [...] }' },
  {
    action: 'list_modules',
    description: 'Lista todos os módulos de um curso.',
    method: 'POST',
    params: [{ name: 'course_id', type: 'string', required: true, description: 'ID do curso' }],
    response: '{ "modules": [...] }',
  },
  {
    action: 'list_lessons',
    description: 'Lista todas as lições de um módulo.',
    method: 'POST',
    params: [{ name: 'module_id', type: 'string', required: true, description: 'ID do módulo' }],
    response: '{ "lessons": [...] }',
  },
  {
    action: 'list_lesson_contents',
    description: 'Lista todos os conteúdos de uma lição.',
    method: 'POST',
    params: [{ name: 'lesson_id', type: 'string', required: true, description: 'ID da lição' }],
    response: '{ "lesson_contents": [...] }',
  },
  // ─── Product CRUD ───
  {
    action: 'create_product',
    description: 'Cria um novo produto. Se has_content=true, cria um curso associado automaticamente.',
    method: 'POST',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nome do produto' },
      { name: 'type', type: 'string', required: true, description: 'Tipo: course, service, consultation, implementation, virtual_event, in_person_event, saas' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
      { name: 'active', type: 'boolean', required: false, description: 'Ativo (padrão: true)' },
      { name: 'has_content', type: 'boolean', required: false, description: 'Se true, cria curso associado' },
      { name: 'payment_type', type: 'string', required: false, description: 'Tipo de pagamento (padrão: one_time)' },
      { name: 'thumbnail_url', type: 'string', required: false, description: 'URL da thumbnail' },
    ],
    response: '{ "success": true, "product": {...} }',
  },
  {
    action: 'update_product',
    description: 'Atualiza um produto existente.',
    method: 'POST',
    params: [
      { name: 'product_id', type: 'string', required: true, description: 'ID do produto' },
      { name: 'name', type: 'string', required: false, description: 'Novo nome' },
      { name: 'description', type: 'string', required: false, description: 'Nova descrição' },
      { name: 'active', type: 'boolean', required: false, description: 'Ativo' },
      { name: 'type', type: 'string', required: false, description: 'Novo tipo' },
    ],
    response: '{ "success": true, "product": {...} }',
  },
  {
    action: 'delete_product',
    description: 'Exclui um produto e todos os dados associados (curso, módulos, lições, etc.).',
    method: 'POST',
    params: [{ name: 'product_id', type: 'string', required: true, description: 'ID do produto' }],
    response: '{ "success": true }',
  },
  // ─── Package CRUD ───
  {
    action: 'create_package',
    description: 'Cria um novo pacote, opcionalmente vinculando produtos.',
    method: 'POST',
    params: [
      { name: 'name', type: 'string', required: true, description: 'Nome do pacote' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
      { name: 'active', type: 'boolean', required: false, description: 'Ativo (padrão: true)' },
      { name: 'payment_type', type: 'string', required: false, description: 'Tipo de pagamento' },
      { name: 'features', type: 'string[]', required: false, description: 'Lista de features' },
      { name: 'product_ids', type: 'string[]', required: false, description: 'IDs de produtos para vincular' },
    ],
    response: '{ "success": true, "package": {...} }',
  },
  {
    action: 'update_package',
    description: 'Atualiza um pacote existente.',
    method: 'POST',
    params: [
      { name: 'package_id', type: 'string', required: true, description: 'ID do pacote' },
      { name: 'name', type: 'string', required: false, description: 'Novo nome' },
      { name: 'description', type: 'string', required: false, description: 'Nova descrição' },
      { name: 'active', type: 'boolean', required: false, description: 'Ativo' },
    ],
    response: '{ "success": true, "package": {...} }',
  },
  {
    action: 'delete_package',
    description: 'Exclui um pacote e todos os vínculos associados.',
    method: 'POST',
    params: [{ name: 'package_id', type: 'string', required: true, description: 'ID do pacote' }],
    response: '{ "success": true }',
  },
  // ─── Module CRUD ───
  {
    action: 'create_module',
    description: 'Cria um novo módulo dentro de um curso.',
    method: 'POST',
    params: [
      { name: 'course_id', type: 'string', required: true, description: 'ID do curso' },
      { name: 'title', type: 'string', required: true, description: 'Título do módulo' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
      { name: 'sort_order', type: 'number', required: false, description: 'Ordem (padrão: 0)' },
    ],
    response: '{ "success": true, "module": {...} }',
  },
  {
    action: 'update_module',
    description: 'Atualiza um módulo existente.',
    method: 'POST',
    params: [
      { name: 'module_id', type: 'string', required: true, description: 'ID do módulo' },
      { name: 'title', type: 'string', required: false, description: 'Novo título' },
      { name: 'description', type: 'string', required: false, description: 'Nova descrição' },
      { name: 'sort_order', type: 'number', required: false, description: 'Nova ordem' },
    ],
    response: '{ "success": true, "module": {...} }',
  },
  {
    action: 'delete_module',
    description: 'Exclui um módulo e todas as lições/conteúdos associados.',
    method: 'POST',
    params: [{ name: 'module_id', type: 'string', required: true, description: 'ID do módulo' }],
    response: '{ "success": true }',
  },
  // ─── Lesson CRUD ───
  {
    action: 'create_lesson',
    description: 'Cria uma nova lição dentro de um módulo.',
    method: 'POST',
    params: [
      { name: 'module_id', type: 'string', required: true, description: 'ID do módulo' },
      { name: 'title', type: 'string', required: true, description: 'Título da lição' },
      { name: 'description', type: 'string', required: false, description: 'Descrição' },
      { name: 'video_url', type: 'string', required: false, description: 'URL do vídeo' },
      { name: 'duration_minutes', type: 'number', required: false, description: 'Duração em minutos' },
      { name: 'is_free', type: 'boolean', required: false, description: 'Gratuita (padrão: false)' },
      { name: 'sort_order', type: 'number', required: false, description: 'Ordem (padrão: 0)' },
    ],
    response: '{ "success": true, "lesson": {...} }',
  },
  {
    action: 'update_lesson',
    description: 'Atualiza uma lição existente.',
    method: 'POST',
    params: [
      { name: 'lesson_id', type: 'string', required: true, description: 'ID da lição' },
      { name: 'title', type: 'string', required: false, description: 'Novo título' },
      { name: 'description', type: 'string', required: false, description: 'Nova descrição' },
      { name: 'video_url', type: 'string', required: false, description: 'Nova URL do vídeo' },
      { name: 'is_free', type: 'boolean', required: false, description: 'Gratuita' },
    ],
    response: '{ "success": true, "lesson": {...} }',
  },
  {
    action: 'delete_lesson',
    description: 'Exclui uma lição e todos os conteúdos/comentários/progresso associados.',
    method: 'POST',
    params: [{ name: 'lesson_id', type: 'string', required: true, description: 'ID da lição' }],
    response: '{ "success": true }',
  },
  // ─── Lesson Content CRUD ───
  {
    action: 'create_lesson_content',
    description: 'Adiciona conteúdo a uma lição (vídeo, texto, imagem, etc.).',
    method: 'POST',
    params: [
      { name: 'lesson_id', type: 'string', required: true, description: 'ID da lição' },
      { name: 'title', type: 'string', required: true, description: 'Título do conteúdo' },
      { name: 'type', type: 'string', required: true, description: 'Tipo: video, text, image, audio, link, pdf' },
      { name: 'content', type: 'string', required: false, description: 'Conteúdo (URL ou texto)' },
      { name: 'sort_order', type: 'number', required: false, description: 'Ordem (padrão: 0)' },
    ],
    response: '{ "success": true, "lesson_content": {...} }',
  },
  {
    action: 'update_lesson_content',
    description: 'Atualiza um conteúdo de lição existente.',
    method: 'POST',
    params: [
      { name: 'content_id', type: 'string', required: true, description: 'ID do conteúdo' },
      { name: 'title', type: 'string', required: false, description: 'Novo título' },
      { name: 'type', type: 'string', required: false, description: 'Novo tipo' },
      { name: 'content', type: 'string', required: false, description: 'Novo conteúdo' },
    ],
    response: '{ "success": true, "lesson_content": {...} }',
  },
  {
    action: 'delete_lesson_content',
    description: 'Exclui um conteúdo de lição.',
    method: 'POST',
    params: [{ name: 'content_id', type: 'string', required: true, description: 'ID do conteúdo' }],
    response: '{ "success": true }',
  },
  // ─── Bulk Operations ───
  {
    action: 'create_bulk_lessons',
    description: 'Importa lições em massa para um módulo. Ideal para migração de outra plataforma.',
    method: 'POST',
    params: [
      { name: 'module_id', type: 'string', required: true, description: 'ID do módulo destino' },
      { name: 'lessons', type: 'array', required: true, description: 'Array de objetos { title, video_url?, description?, duration_minutes? }' },
    ],
    response: '{ "success": true, "created_count": 10, "lessons": [...] }',
  },
];

const AdminAPI: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [newKey, setNewKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) return;
    setTestingKey(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey.trim() },
        body: JSON.stringify({ action: 'list_courses' }),
      });
      setKeyStatus(res.ok ? 'valid' : 'invalid');
    } catch {
      setKeyStatus('invalid');
    }
    setTestingKey(false);
  };

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'mak_';
    for (let i = 0; i < 40; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewKey(key);
  };

  const saveNewKey = async () => {
    if (!newKey.trim()) return;
    setSavingKey(true);
    // We update via the automation-api itself or by calling a helper function
    // For now, show instructions since we can't update secrets from client
    toast({
      title: 'Chave gerada!',
      description: 'Copie a chave acima e configure-a como secret AUTOMATION_API_KEY no backend.',
    });
    setSavingKey(false);
  };

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">🔌 API de Automação</h2>
      <p className="text-sm text-muted-foreground mb-6">Gerencie a chave de acesso e consulte a documentação da API para integrações externas.</p>

      <div className="space-y-6 max-w-4xl">
        {/* API Key Management */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">Chave da API</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Use a chave no header <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code> de todas as requisições.
          </p>

          {/* Generate new key */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border mb-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Gerar nova chave</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={generateKey} className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Gerar Chave
              </Button>
            </div>
            {newKey && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="bg-background border border-border rounded px-3 py-2 text-sm font-mono flex-1 break-all">{newKey}</code>
                  <button onClick={() => copyToClipboard(newKey)} className="text-muted-foreground hover:text-foreground shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-amber-500">
                  ⚠️ Copie esta chave agora! Depois de fechar, ela não será mais exibida. Configure-a como a variável <code className="font-mono">AUTOMATION_API_KEY</code> nos secrets do backend.
                </p>
              </div>
            )}
          </div>

          {/* Test key */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Testar chave existente</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Cole sua chave aqui para testar..."
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setKeyStatus('idle'); }}
                  className="bg-secondary border-border pr-10 font-mono text-sm"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button onClick={testApiKey} disabled={!apiKey.trim() || testingKey} variant="outline" size="default">
                {testingKey ? 'Testando...' : 'Testar'}
              </Button>
            </div>

            {keyStatus === 'valid' && (
              <div className="flex items-center gap-2 text-sm text-green-500">
                <Check className="w-4 h-4" />
                <span>Chave válida! Conexão bem-sucedida.</span>
              </div>
            )}
            {keyStatus === 'invalid' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Shield className="w-4 h-4" />
                <span>Chave inválida ou sem permissão.</span>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1 font-semibold">Endpoint da API:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground flex-1 truncate">{endpoint}</code>
              <button onClick={() => copyToClipboard(endpoint)} className="text-muted-foreground hover:text-foreground">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </Card>

        {/* Documentation Toggle */}
        <Button onClick={() => setShowDocs(!showDocs)} variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4" />
            {showDocs ? 'Ocultar Documentação' : 'Ver Documentação Completa da API'}
          </span>
          <ExternalLink className="w-4 h-4" />
        </Button>

        {showDocs && (
          <div className="space-y-6">
            <Card className="p-5 bg-card border-border">
              <h3 className="text-lg font-display font-bold mb-2">🔐 Autenticação</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Todas as requisições devem incluir o header <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono">x-api-key</code>.
              </p>
              <div className="bg-secondary rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <p className="text-muted-foreground">POST {endpoint}</p>
                <p className="text-muted-foreground">Content-Type: application/json</p>
                <p className="text-muted-foreground">x-api-key: SUA_CHAVE_AQUI</p>
              </div>
            </Card>

            <Card className="p-5 bg-card border-border">
              <h3 className="text-lg font-display font-bold mb-2">⚠️ Códigos de Erro</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {[['400', 'Parâmetros inválidos'], ['401', 'API key inválida'], ['404', 'Recurso não encontrado'], ['409', 'Conflito (USER_EXISTS)'], ['500', 'Erro interno']].map(([code, desc]) => (
                  <div key={code} className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                    <Badge variant="outline" className="font-mono text-xs">{code}</Badge>
                    <span className="text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </Card>

            <h3 className="text-xl font-display font-bold">📋 Ações Disponíveis</h3>
            {actions.map((a) => (
              <Card key={a.action} className="p-5 bg-card border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="font-mono text-xs bg-primary/10 text-primary border-primary/20">{a.action}</Badge>
                  <Badge variant="outline" className="text-xs">{a.method}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{a.description}</p>
                {a.params.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Parâmetros</h4>
                    <div className="border border-border rounded-lg overflow-hidden mb-4">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-secondary/50 text-xs text-muted-foreground">
                          <th className="px-3 py-2 text-left">Campo</th><th className="px-3 py-2 text-left">Tipo</th>
                          <th className="px-3 py-2 text-left">Obrigatório</th><th className="px-3 py-2 text-left">Descrição</th>
                        </tr></thead>
                        <tbody>
                          {a.params.map((p) => (
                            <tr key={p.name} className="border-t border-border">
                              <td className="px-3 py-2 font-mono text-xs">{p.name}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{p.type}</td>
                              <td className="px-3 py-2">{p.required ? <Badge className="text-xs bg-red-500/10 text-red-500 border-red-500/20">sim</Badge> : <Badge variant="secondary" className="text-xs">não</Badge>}</td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{p.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Exemplo</h4>
                <div className="bg-secondary rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre mb-4">
                  {JSON.stringify({ action: a.action, ...(a.params.length > 0 ? Object.fromEntries(a.params.slice(0, 3).map(p => [p.name, p.type === 'boolean' ? true : `exemplo_${p.name}`])) : {}) }, null, 2)}
                </div>
                <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Resposta</h4>
                <div className="bg-secondary rounded-lg p-3 font-mono text-xs overflow-x-auto whitespace-pre">{a.response}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAPI;
