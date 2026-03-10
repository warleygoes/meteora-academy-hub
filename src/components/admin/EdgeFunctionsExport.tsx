import React, { useState } from 'react';
import { Loader2, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

// Import all edge function sources at build time
import automationApi from '../../../supabase/functions/automation-api/index.ts?raw';
import checkSubscription from '../../../supabase/functions/check-subscription/index.ts?raw';
import createCheckout from '../../../supabase/functions/create-checkout/index.ts?raw';
import customerPortal from '../../../supabase/functions/customer-portal/index.ts?raw';
import dispatchWebhook from '../../../supabase/functions/dispatch-webhook/index.ts?raw';
import exportStorage from '../../../supabase/functions/export-storage/index.ts?raw';
import exportUsers from '../../../supabase/functions/export-users/index.ts?raw';
import generateProductContent from '../../../supabase/functions/generate-product-content/index.ts?raw';
import generateSalesPageContent from '../../../supabase/functions/generate-sales-page-content/index.ts?raw';
import importUsers from '../../../supabase/functions/import-users/index.ts?raw';
import migrateUsers from '../../../supabase/functions/migrate-users/index.ts?raw';
import notifyNewRegistration from '../../../supabase/functions/notify-new-registration/index.ts?raw';
import pgDumpExport from '../../../supabase/functions/pg-dump-export/index.ts?raw';
import resetUserPassword from '../../../supabase/functions/reset-user-password/index.ts?raw';
import translateCategory from '../../../supabase/functions/translate-category/index.ts?raw';

interface FunctionInfo {
  name: string;
  source: string;
  verifyJwt: boolean;
}

const EDGE_FUNCTIONS: FunctionInfo[] = [
  { name: 'automation-api', source: automationApi, verifyJwt: false },
  { name: 'check-subscription', source: checkSubscription, verifyJwt: true },
  { name: 'create-checkout', source: createCheckout, verifyJwt: true },
  { name: 'customer-portal', source: customerPortal, verifyJwt: true },
  { name: 'dispatch-webhook', source: dispatchWebhook, verifyJwt: false },
  { name: 'export-storage', source: exportStorage, verifyJwt: true },
  { name: 'export-users', source: exportUsers, verifyJwt: true },
  { name: 'generate-product-content', source: generateProductContent, verifyJwt: false },
  { name: 'generate-sales-page-content', source: generateSalesPageContent, verifyJwt: false },
  { name: 'import-users', source: importUsers, verifyJwt: false },
  { name: 'migrate-users', source: migrateUsers, verifyJwt: false },
  { name: 'notify-new-registration', source: notifyNewRegistration, verifyJwt: false },
  { name: 'pg-dump-export', source: pgDumpExport, verifyJwt: true },
  { name: 'reset-user-password', source: resetUserPassword, verifyJwt: false },
  { name: 'translate-category', source: translateCategory, verifyJwt: false },
];

const EdgeFunctionsExport: React.FC = () => {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const generateConfigToml = (): string => {
    const lines: string[] = [
      '# Supabase Edge Functions Configuration',
      '# Coloque este arquivo em: supabase/config.toml',
      `# Gerado em: ${new Date().toISOString()}`,
      '',
    ];

    for (const fn of EDGE_FUNCTIONS) {
      if (!fn.verifyJwt) {
        lines.push(`[functions.${fn.name}]`);
        lines.push(`verify_jwt = false`);
        lines.push('');
      }
    }

    return lines.join('\n');
  };

  const generateReadme = (): string => {
    return `# Edge Functions - Meteora Academy
Exportado em: ${new Date().toISOString()}

## Estrutura
\`\`\`
supabase/
├── config.toml          # Configuração das functions
└── functions/
${EDGE_FUNCTIONS.map(fn => `    ├── ${fn.name}/\n    │   └── index.ts`).join('\n')}
\`\`\`

## Como importar no Supabase Self-hosted

### 1. Copie os arquivos
Copie toda a pasta \`supabase/\` para a raiz do seu projeto.

### 2. Configure os Secrets
Antes de fazer deploy, configure os seguintes secrets no seu Supabase:

\`\`\`bash
supabase secrets set SUPABASE_URL=https://seu-projeto.supabase.co
supabase secrets set SUPABASE_ANON_KEY=sua-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
supabase secrets set SUPABASE_DB_URL=postgresql://...
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set N8N_WEBHOOK_URL=https://...
supabase secrets set AUTOMATION_API_KEY=sua-api-key
\`\`\`

### 3. Deploy das Functions
\`\`\`bash
# Deploy de todas as functions
supabase functions deploy

# Ou deploy individual
supabase functions deploy automation-api
supabase functions deploy check-subscription
# ... etc
\`\`\`

### 4. Functions com verify_jwt = false
As seguintes functions NÃO verificam JWT (configurado em config.toml):
${EDGE_FUNCTIONS.filter(fn => !fn.verifyJwt).map(fn => `- ${fn.name}`).join('\n')}

As demais functions requerem um JWT válido no header Authorization.

## Notas
- Certifique-se de que o banco de dados já tenha as tabelas e RLS policies criadas antes de testar as functions.
- Algumas functions dependem de configurações em \`platform_settings\` (ex: openai_api_key para tradução e geração de conteúdo).
`;
  };

  const downloadEdgeFunctions = async () => {
    setDownloading(true);
    try {
      toast({ title: 'Gerando ZIP...', description: `Empacotando ${EDGE_FUNCTIONS.length} Edge Functions.` });

      const zip = new JSZip();
      const supabaseFolder = zip.folder('supabase')!;
      const functionsFolder = supabaseFolder.folder('functions')!;

      // Add config.toml
      supabaseFolder.file('config.toml', generateConfigToml());

      // Add README
      zip.file('README.md', generateReadme());

      // Add each function
      for (const fn of EDGE_FUNCTIONS) {
        const fnFolder = functionsFolder.folder(fn.name)!;
        fnFolder.file('index.ts', fn.source);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `edge_functions_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(blobUrl);

      toast({
        title: 'Sucesso',
        description: `ZIP com ${EDGE_FUNCTIONS.length} Edge Functions, config.toml e README baixado.`,
      });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">⚡ Exportar Edge Functions</p>
      <p className="text-xs text-muted-foreground">
        Baixa todas as {EDGE_FUNCTIONS.length} Edge Functions como ZIP, incluindo config.toml e README com instruções de deploy.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2" onClick={downloadEdgeFunctions} disabled={downloading}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
          Edge Functions (ZIP)
        </Button>
      </div>
    </div>
  );
};

export default EdgeFunctionsExport;
