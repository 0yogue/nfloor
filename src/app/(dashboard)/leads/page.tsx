"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LeadList, LeadDetails } from "@/components/leads";
import { LeadFull } from "@/types/leads";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Mail, FileText, CheckCircle2 } from "lucide-react";

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, set_leads] = useState<LeadFull[]>([]);
  const [selected_lead, set_selected_lead] = useState<LeadFull | null>(null);
  const [is_loading, set_is_loading] = useState(true);
  const [show_import_dialog, set_show_import_dialog] = useState(false);

  useEffect(() => {
    fetch_leads();
  }, []);

  async function fetch_leads() {
    try {
      set_is_loading(true);
      const response = await fetch("/api/leads");
      const data = await response.json();
      if (data.success) {
        set_leads(data.data);
        if (data.data.length > 0 && !selected_lead) {
          set_selected_lead(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      set_is_loading(false);
    }
  }

  function handle_select_lead(lead: LeadFull) {
    set_selected_lead(lead);
  }

  function handle_import_click() {
    set_show_import_dialog(true);
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      <div className="w-[25%] min-w-[280px] max-w-[400px] shrink-0">
        <LeadList
          leads={leads}
          selected_lead={selected_lead}
          on_select={handle_select_lead}
          on_import_click={handle_import_click}
        />
      </div>

      <div className="flex-1 bg-muted/30">
        <LeadDetails lead={selected_lead} />
      </div>

      <ImportDialog open={show_import_dialog} on_close={() => set_show_import_dialog(false)} on_success={fetch_leads} />
    </div>
  );
}

interface ImportDialogProps {
  open: boolean;
  on_close: () => void;
  on_success: () => void;
}

function ImportDialog({ open, on_close, on_success }: ImportDialogProps) {
  const [is_importing, set_is_importing] = useState(false);
  const [import_result, set_import_result] = useState<{ success: number; failed: number } | null>(null);

  async function handle_file_upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    set_is_importing(true);
    set_import_result(null);

    try {
      const form_data = new FormData();
      form_data.append("file", file);

      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: form_data,
      });

      const data = await response.json();
      if (data.success) {
        set_import_result({ success: data.imported, failed: data.failed });
        on_success();
      }
    } catch (error) {
      console.error("Erro na importação:", error);
    } finally {
      set_is_importing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={on_close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Leads</DialogTitle>
          <DialogDescription>Importe leads de emails ou arquivos CSV</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2">
              <FileText className="h-4 w-4" />
              Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Integração de Email</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Configure a integração para importar leads automaticamente dos portais imobiliários.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ZAP Imóveis</Badge>
                    <span className="text-xs text-muted-foreground">zapimoveis.com.br</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Viva Real</Badge>
                    <span className="text-xs text-muted-foreground">vivareal.com.br</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between p-2 border rounded bg-background">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">OLX</Badge>
                    <span className="text-xs text-muted-foreground">olx.com.br</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline" disabled>
                Configurar Integração (em breve)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <div className="p-4 border-2 border-dashed rounded-lg text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Arraste um arquivo .eml ou .csv</p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".eml,.csv"
                  className="hidden"
                  onChange={handle_file_upload}
                  disabled={is_importing}
                />
                <Button variant="outline" size="sm" disabled={is_importing} asChild>
                  <span>{is_importing ? "Importando..." : "Selecionar Arquivo"}</span>
                </Button>
              </Label>
            </div>

            {import_result && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ {import_result.success} lead(s) importado(s) com sucesso
                  {import_result.failed > 0 && ` • ${import_result.failed} falha(s)`}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
