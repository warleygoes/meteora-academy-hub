import React, { useState } from 'react';
import { Download, Loader2, FileDown, TableProperties, Archive, Users, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

interface TableInfo {
  table: string;
  rows: number;
}

interface BucketInfo {
  bucket: string;
  files: number;
}

interface SignedFile {
  path: string;
  url: string;
}

const DatabaseExportSection: React.FC = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Debes estar autenticado.');
    return {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
  };

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pg-dump-export`;
  const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-storage`;
  const usersUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-users`;

  const loadTables = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${baseUrl}?mode=list`, { headers });
      if (!res.ok) throw new Error('Error al cargar tablas');
      const data: TableInfo[] = await res.json();
      setTables(data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const downloadFile = async (url: string, filename: string) => {
    const headers = await getAuthHeaders();
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error' }));
      throw new Error(err.error || 'Error al exportar');
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const downloadTable = async (tableName: string) => {
    setDownloading(tableName);
    try {
      await downloadFile(`${baseUrl}?mode=table&table=${tableName}`, `${tableName}_${new Date().toISOString().slice(0, 10)}.sql`);
      toast({ title: 'Éxito', description: `${tableName} descargado.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadSchema = async () => {
    setDownloading('__schema__');
    try {
      toast({ title: 'Gerando schema...', description: 'Extraindo estrutura das tabelas.' });
      await downloadFile(`${baseUrl}?mode=schema`, `schema_${new Date().toISOString().slice(0, 10)}.sql`);
      toast({ title: 'Éxito', description: 'Schema descargado.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadDataOnly = async () => {
    setDownloading('__data__');
    try {
      toast({ title: 'Gerando dump de dados...', description: 'Somente INSERTs, sem DDL.' });
      await downloadFile(`${baseUrl}?mode=data`, `data_only_${new Date().toISOString().slice(0, 10)}.sql`);
      toast({ title: 'Sucesso', description: 'Dump de dados baixado.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadFull = async () => {
    setDownloading('__full__');
    try {
      toast({ title: 'Generando dump completo...', description: 'Esto puede tardar unos segundos.' });
      await downloadFile(`${baseUrl}?mode=full`, `pg_dump_full_${new Date().toISOString().slice(0, 10)}.sql`);
      toast({ title: 'Éxito', description: 'Dump completo descargado.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadStorageBucket = async (bucket: string) => {
    const key = `__storage_${bucket}__`;
    setDownloading(key);
    try {
      toast({ title: `Exportando ${bucket}...`, description: 'Obtendo URLs e baixando arquivos no navegador...' });
      const headers = await getAuthHeaders();
      const res = await fetch(`${storageUrl}?bucket=${bucket}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao exportar' }));
        throw new Error(err.error || 'Erro ao exportar storage');
      }
      const { files }: { bucket: string; files: SignedFile[] } = await res.json();

      if (files.length === 0) {
        toast({ title: 'Info', description: `Bucket ${bucket} está vazio.` });
        setDownloading(null);
        return;
      }

      // Download files in browser and zip client-side
      const zip = new JSZip();
      let downloaded = 0;

      for (const file of files) {
        try {
          const fileRes = await fetch(file.url);
          if (!fileRes.ok) continue;
          const blob = await fileRes.blob();
          zip.file(file.path, blob);
          downloaded++;
        } catch {
          console.warn(`Falha ao baixar: ${file.path}`);
        }
      }

      toast({ title: 'Compactando...', description: `${downloaded} arquivos baixados, gerando ZIP...` });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${bucket}_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(blobUrl);

      toast({ title: 'Sucesso', description: `${bucket} exportado com ${downloaded} arquivos.` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadAllStorage = async () => {
    setDownloading('__storage_all__');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(storageUrl, { headers });
      if (!res.ok) throw new Error('Erro ao listar buckets');
      const buckets: BucketInfo[] = await res.json();
      const nonEmpty = buckets.filter(b => b.files > 0);
      toast({ title: `Exportando ${nonEmpty.length} buckets...`, description: 'Um ZIP por bucket.' });

      for (const b of nonEmpty) {
        await downloadStorageBucket(b.bucket);
        await new Promise(r => setTimeout(r, 500));
      }
      toast({ title: 'Sucesso', description: 'Todos os buckets exportados.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadAllSeparate = async () => {
    setDownloading('__all__');
    try {
      const headers = await getAuthHeaders();
      let tableList = tables;
      if (tableList.length === 0) {
        const res = await fetch(`${baseUrl}?mode=list`, { headers });
        tableList = await res.json();
        setTables(tableList);
      }
      toast({ title: `Descargando ${tableList.length} tablas...` });
      for (const t of tableList) {
        await downloadFile(`${baseUrl}?mode=table&table=${t.table}`, `${t.table}.sql`);
        await new Promise(r => setTimeout(r, 300));
      }
      toast({ title: 'Éxito', description: `${tableList.length} archivos descargados.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadUsersCSV = async () => {
    setDownloading('__users_csv__');
    try {
      toast({ title: 'Exportando usuários...', description: 'Buscando todos os usuários (CSV).' });
      await downloadFile(`${usersUrl}?format=csv`, `users_${new Date().toISOString().slice(0, 10)}.csv`);
      toast({ title: 'Sucesso', description: 'Usuários exportados em CSV.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadUsersJSON = async () => {
    setDownloading('__users_json__');
    try {
      toast({ title: 'Exportando usuários...', description: 'Buscando todos os usuários (JSON).' });
      await downloadFile(`${usersUrl}?format=json`, `users_${new Date().toISOString().slice(0, 10)}.json`);
      toast({ title: 'Sucesso', description: 'Usuários exportados em JSON.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadUsersSQL = async () => {
    setDownloading('__users_sql__');
    try {
      toast({ title: 'Exportando usuários...', description: 'Gerando SQL com auth.users + auth.identities.' });
      await downloadFile(`${usersUrl}?format=sql`, `auth_users_${new Date().toISOString().slice(0, 10)}.sql`);
      toast({ title: 'Sucesso', description: 'Usuários exportados como SQL pronto para importação.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const escapeSQL = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const downloadProfilesSQL = async () => {
    setDownloading('__profiles_sql__');
    try {
      toast({ title: 'Exportando profiles...', description: 'Gerando SQL INSERTs.' });
      let allProfiles: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase.from('profiles').select('*').range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allProfiles = allProfiles.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }
      if (allProfiles.length === 0) {
        toast({ title: 'Info', description: 'Nenhum profile encontrado.' });
        setDownloading(null);
        return;
      }
      const cols = Object.keys(allProfiles[0]);
      const lines = allProfiles.map(row => {
        const vals = cols.map(c => escapeSQL(row[c]));
        return `INSERT INTO public.profiles (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT (user_id) DO UPDATE SET ${cols.filter(c => c !== 'id' && c !== 'user_id').map(c => `${c} = EXCLUDED.${c}`).join(', ')};`;
      });
      const sql = `-- profiles export ${new Date().toISOString()}\n-- ${allProfiles.length} registros\nSET session_replication_role = 'replica';\n\n${lines.join('\n')}\n\nSET session_replication_role = 'origin';\n`;
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profiles_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Sucesso', description: `${allProfiles.length} profiles exportados como SQL.` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadUserRolesSQL = async () => {
    setDownloading('__roles_sql__');
    try {
      toast({ title: 'Exportando user_roles...', description: 'Gerando SQL INSERTs.' });
      let allRoles: any[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase.from('user_roles').select('*').range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRoles = allRoles.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
      }
      if (allRoles.length === 0) {
        toast({ title: 'Info', description: 'Nenhum role encontrado.' });
        setDownloading(null);
        return;
      }
      const lines = allRoles.map(row =>
        `INSERT INTO public.user_roles (id, user_id, role) VALUES (${escapeSQL(row.id)}, ${escapeSQL(row.user_id)}, ${escapeSQL(row.role)}) ON CONFLICT (user_id, role) DO NOTHING;`
      );
      const sql = `-- user_roles export ${new Date().toISOString()}\n-- ${allRoles.length} registros\nSET session_replication_role = 'replica';\n\n${lines.join('\n')}\n\nSET session_replication_role = 'origin';\n`;
      const blob = new Blob([sql], { type: 'text/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_roles_${new Date().toISOString().slice(0, 10)}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Sucesso', description: `${allRoles.length} roles exportados como SQL.` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const isDownloading = !!downloading;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exporta los datos en archivos SQL separados por tabla para evitar el error de "Query too large" al importar.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="gap-2" onClick={downloadSchema} disabled={isDownloading}>
          {downloading === '__schema__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <TableProperties className="w-4 h-4" />}
          Somente Schema (DDL)
        </Button>
        <Button variant="outline" className="gap-2" onClick={downloadDataOnly} disabled={isDownloading}>
          {downloading === '__data__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Somente Dados (INSERTs)
        </Button>
        <Button variant="outline" className="gap-2" onClick={downloadFull} disabled={isDownloading}>
          {downloading === '__full__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Dump completo (1 archivo)
        </Button>
        <Button variant="outline" className="gap-2" onClick={downloadAllSeparate} disabled={isDownloading}>
          {downloading === '__all__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Descargar por tabla (separados)
        </Button>
        <Button variant="ghost" size="sm" onClick={loadTables} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ver tablas'}
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">📦 Exportar Storage (por bucket)</p>
        <div className="flex flex-wrap gap-2">
          {["avatars", "product-images", "community-images"].map(bucket => (
            <Button key={bucket} variant="outline" className="gap-2" onClick={() => downloadStorageBucket(bucket)} disabled={isDownloading}>
              {downloading === `__storage_${bucket}__` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
              {bucket}
            </Button>
          ))}
          <Button variant="outline" className="gap-2" onClick={downloadAllStorage} disabled={isDownloading}>
            {downloading === '__storage_all__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            Todos os Buckets
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">👤 Exportar Usuários (auth.users)</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={downloadUsersCSV} disabled={isDownloading}>
            {downloading === '__users_csv__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Usuários (CSV)
          </Button>
          <Button variant="outline" className="gap-2" onClick={downloadUsersJSON} disabled={isDownloading}>
            {downloading === '__users_json__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Usuários (JSON)
          </Button>
          <Button variant="outline" className="gap-2" onClick={downloadUsersSQL} disabled={isDownloading}>
            {downloading === '__users_sql__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            Usuários (SQL)
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">📄 Exportar SQL INSERTs (para migração)</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={downloadProfilesSQL} disabled={isDownloading}>
            {downloading === '__profiles_sql__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            Profiles (SQL)
          </Button>
          <Button variant="outline" className="gap-2" onClick={downloadUserRolesSQL} disabled={isDownloading}>
            {downloading === '__roles_sql__' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode className="w-4 h-4" />}
            User Roles (SQL)
          </Button>
        </div>
      </div>

      {tables.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Tabla</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Filas</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tables.map(t => (
                  <tr key={t.table} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-3 py-1.5 font-mono text-xs">{t.table}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{t.rows}</td>
                    <td className="px-3 py-1.5 text-right">
                      {t.rows > 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs" disabled={isDownloading} onClick={() => downloadTable(t.table)}>
                          {downloading === t.table ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">📋 Ordem de importação (respeitando FKs):</p>
        <p>0. <code className="bg-secondary px-1 rounded">SET session_replication_role = 'replica';</code></p>
        <p className="font-medium text-foreground mt-1">1️⃣ Categorias & Cursos</p>
        <p className="pl-3">course_categories → courses → course_modules → course_lessons → lesson_contents</p>
        <p className="font-medium text-foreground mt-1">2️⃣ Produtos & Pacotes</p>
        <p className="pl-3">products → product_categories → product_sales_pages → packages → package_product_groups → package_products → offers</p>
        <p className="font-medium text-foreground mt-1">3️⃣ Planos & Serviços</p>
        <p className="pl-3">services → plans → plan_courses → plan_services → plan_meetings</p>
        <p className="font-medium text-foreground mt-1">4️⃣ Usuários (auth)</p>
        <p className="pl-3"><strong>auth.users + auth.identities</strong> (usar arquivo Usuários SQL) → profiles → user_roles</p>
        <p className="font-medium text-foreground mt-1">5️⃣ Assinaturas & Acesso</p>
        <p className="pl-3">user_plans → user_products → user_lesson_access → course_enrollments</p>
        <p className="font-medium text-foreground mt-1">6️⃣ Progresso & Avaliações</p>
        <p className="pl-3">lesson_progress → lesson_ratings → lesson_comments</p>
        <p className="font-medium text-foreground mt-1">7️⃣ Comunidade</p>
        <p className="pl-3">community_posts → community_comments → community_likes</p>
        <p className="font-medium text-foreground mt-1">8️⃣ Diagnósticos</p>
        <p className="pl-3">diagnostic_questions → diagnostics → diagnostic_answers → diagnostic_lead_tracking → diagnostic_recommendation_rules</p>
        <p className="font-medium text-foreground mt-1">9️⃣ UI & Sistema</p>
        <p className="pl-3">banners → menu_links → menu_link_products → menu_link_packages → network_topologies → platform_settings → testimonials → system_logs → webhook_endpoints → webhook_event_types</p>
        <p className="mt-1">🔚 <code className="bg-secondary px-1 rounded">SET session_replication_role = 'origin';</code></p>
      </div>
    </div>
  );
};

export default DatabaseExportSection;
