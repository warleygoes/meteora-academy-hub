import React, { useState } from 'react';
import { Download, Loader2, FileDown, TableProperties, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TableInfo {
  table: string;
  rows: number;
}

interface BucketInfo {
  bucket: string;
  files: number;
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
      toast({ title: `Exportando ${bucket}...`, description: 'Isso pode levar alguns segundos.' });
      const headers = await getAuthHeaders();
      const res = await fetch(`${storageUrl}?bucket=${bucket}`, { headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro ao exportar' }));
        throw new Error(err.error || 'Erro ao exportar storage');
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${bucket}_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: 'Sucesso', description: `${bucket} exportado com sucesso.` });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
    setDownloading(null);
  };

  const downloadAllStorage = async () => {
    setDownloading('__storage_all__');
    try {
      const headers = await getAuthHeaders();
      // Get bucket info
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
      const nonEmpty = tableList.filter(t => t.rows > 0);
      toast({ title: `Descargando ${nonEmpty.length} tablas...` });
      for (const t of nonEmpty) {
        await downloadFile(`${baseUrl}?mode=table&table=${t.table}`, `${t.table}.sql`);
        await new Promise(r => setTimeout(r, 300));
      }
      toast({ title: 'Éxito', description: `${nonEmpty.length} archivos descargados.` });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
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
        <p className="font-medium text-foreground">📋 Orden de importación:</p>
        <p>1. Execute <code className="bg-secondary px-1 rounded">SET session_replication_role = 'replica';</code> para desabilitar constraints</p>
        <p>2. Importe cada archivo .sql por tabla</p>
        <p>3. Execute <code className="bg-secondary px-1 rounded">SET session_replication_role = 'origin';</code> para reabilitar constraints</p>
      </div>
    </div>
  );
};

export default DatabaseExportSection;
