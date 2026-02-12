import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParsedUser {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  registered_at?: string;
  last_login?: string;
  completion_pct?: string;
}

interface ImportResult {
  email: string;
  status: 'created' | 'exists' | 'error';
  message?: string;
}

interface ImportUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

function parseCSV(text: string): ParsedUser[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = headerLine.match(/("([^"]*)")|([^,]+)/g)?.map(h => h.replace(/^"|"$/g, '').trim()) || [];

  const users: ParsedUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Parse CSV fields respecting quotes
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());

    const get = (name: string) => {
      const idx = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
      return idx >= 0 ? fields[idx]?.trim() || '' : '';
    };

    const email = get('Email');
    if (!email || !email.includes('@')) continue;

    users.push({
      name: get('Nome Completo') || get('Nome') || get('Name'),
      email,
      cpf: get('CPF'),
      phone: get('Telefone') || get('Phone'),
      gender: get('Gênero') || get('Gender'),
      birth_date: get('Nascimento') || get('Birth'),
      registered_at: get('Cadastro') || get('Registered'),
      last_login: get('Login') || get('Last Login'),
      completion_pct: get('Conclusão') || get('Completion'),
    });
  }

  return users;
}

const ImportUsersDialog: React.FC<ImportUsersDialogProps> = ({ open, onOpenChange, onImportComplete }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [defaultPassword, setDefaultPassword] = useState('');
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState({ created: 0, exists: 0, errors: 0 });

  const reset = () => {
    setStep('upload');
    setParsedUsers([]);
    setDefaultPassword('');
    setFileName('');
    setResults([]);
    setSummary({ created: 0, exists: 0, errors: 0 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const users = parseCSV(text);
      setParsedUsers(users);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!defaultPassword || defaultPassword.length < 6) {
      toast({ title: t('importPasswordRequired'), variant: 'destructive' });
      return;
    }

    setStep('importing');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ users: parsedUsers, defaultPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setResults(data.results || []);
      setSummary({ created: data.created || 0, exists: data.exists || 0, errors: data.errors || 0 });
      setStep('results');
      onImportComplete();
    } catch (err: any) {
      toast({ title: t('errorOccurred'), description: err.message, variant: 'destructive' });
      setStep('preview');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> {t('importUsers')}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">{t('importClickOrDrag')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('importCSVFormat')}</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium">{fileName}</span>
              <Badge variant="secondary">{parsedUsers.length} {t('usersFound')}</Badge>
            </div>

            <ScrollArea className="h-48 border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="p-2">{t('displayName')}</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">CPF</th>
                    <th className="p-2">{t('phone')}</th>
                    <th className="p-2">{t('gender')}</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedUsers.slice(0, 50).map((u, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 text-foreground">{u.name}</td>
                      <td className="p-2 text-muted-foreground">{u.email}</td>
                      <td className="p-2 text-muted-foreground">{u.cpf || '—'}</td>
                      <td className="p-2 text-muted-foreground">{u.phone || '—'}</td>
                      <td className="p-2 text-muted-foreground">{u.gender || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="space-y-2">
              <Label>{t('importDefaultPassword')}</Label>
              <Input
                type="password"
                placeholder={t('importPasswordPlaceholder')}
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground">{t('importPasswordHint')}</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>{t('cancel')}</Button>
              <Button onClick={handleImport} disabled={!defaultPassword || defaultPassword.length < 6} className="gap-2">
                <Upload className="w-4 h-4" /> {t('importStart')} ({parsedUsers.length})
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
            <p className="text-foreground font-medium">{t('importInProgress')}</p>
            <p className="text-sm text-muted-foreground">{t('importPleaseWait')}</p>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-500">{summary.created}</p>
                <p className="text-xs text-muted-foreground">{t('importCreated')}</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-yellow-500">{summary.exists}</p>
                <p className="text-xs text-muted-foreground">{t('importExisting')}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                <XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-500">{summary.errors}</p>
                <p className="text-xs text-muted-foreground">{t('importErrors')}</p>
              </div>
            </div>

            {results.filter(r => r.status === 'error').length > 0 && (
              <ScrollArea className="h-32 border border-border rounded-lg p-2">
                {results.filter(r => r.status === 'error').map((r, i) => (
                  <div key={i} className="text-xs text-red-400 py-1">
                    <span className="font-medium">{r.email}</span>: {r.message}
                  </div>
                ))}
              </ScrollArea>
            )}

            <Button onClick={() => { reset(); onOpenChange(false); }} className="w-full">{t('close')}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportUsersDialog;
