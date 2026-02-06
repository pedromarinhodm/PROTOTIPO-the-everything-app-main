import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDown, FileText, Trash2, Plus } from "lucide-react";
import { FileUpload } from "../components/ui/file-upload";
import { api } from "@/services/api";
import { toast } from "sonner";

type FileItem = {
  _id: string;
  fileId: string;
  filename: string;
  data_inicial: string;
  data_final: string;
  uploadDate: string;
};

export default function Formularios() {
  const [lista, setLista] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filterIni, setFilterIni] = useState("");
  const [filterFim, setFilterFim] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    try {
      const res = await api.files.getAll();
      setLista(res);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível carregar os formulários");
    } finally {
      setLoading(false);
    }
  }

  function filtrarLista() {
    return lista.filter((f) => {
      if (!filterIni && !filterFim) return true;
      const dataIni = f.data_inicial ? new Date(f.data_inicial + 'T00:00:00') : null;
      const dataFim = f.data_final ? new Date(f.data_final + 'T00:00:00') : null;
      if (!dataIni || !dataFim) return false;
      if (filterIni) {
        const di = new Date(`${filterIni}T00:00:00`);
        if (dataIni < di) return false;
      }
      if (filterFim) {
        const df = new Date(`${filterFim}T23:59:59`);
        if (dataFim > df) return false;
      }
      return true;
    });
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    console.log("Form submitted", { fileInput, dataInicial, dataFinal });

    if (!fileInput) {
      toast.error("Selecione um arquivo PDF para enviar");
      return;
    }

    if (!dataInicial || !dataFinal) {
      toast.error("Preencha as datas inicial e final");
      return;
    }

    const fd = new FormData();
    fd.append("arquivo", fileInput);
    fd.append("data_inicial", dataInicial);
    fd.append("data_final", dataFinal);

    try {
      console.log("Sending upload request...");
      const result = await api.files.upload(fd);
      console.log("Upload result:", result);
      toast.success("Formulário anexado com sucesso!");
      setOpenModal(false);
      setFileInput(null);
      setDataInicial("");
      setDataFinal("");
      carregar();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err?.message || "Erro ao anexar formulário");
    }
  }

  function visualizar(id: string) {
    const url = (import.meta.env.VITE_API_URL || "http://localhost:3000") + `/api/formularios/${id}/view`;
    window.open(url, "_blank");
  }

  async function baixar(id: string, nome?: string) {
    try {
      await api.files.download(id);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao baixar arquivo");
    }
  }

  async function excluir(id: string) {
    if (!confirm("Deseja realmente excluir este arquivo?")) return;
    try {
      await api.files.delete(id);
      toast.success("Arquivo excluído com sucesso");
      carregar();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir arquivo");
    }
  }

  return (
    <MainLayout>
      <PageHeader
        title="Formulários"
        description="Anexe, visualize e gerencie formulários em PDF"
        action={
          <div className="flex gap-2">
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Anexar Formulário
                </Button>
              </DialogTrigger>
              <form onSubmit={enviar}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Anexar Formulário (PDF)</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Data Inicial</Label>
                        <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} required />
                      </div>
                      <div>
                        <Label>Data Final</Label>
                        <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} required />
                      </div>
                    </div>

                    <div>
                      <Label>Arquivo (PDF)</Label>
                      <FileUpload
                        selectedFile={fileInput}
                        onFileSelect={setFileInput}
                        accept="application/pdf"
                        maxSize={10}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button type="submit">Enviar</Button>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Data Inicial</Label>
              <Input type="date" value={filterIni} onChange={(e) => setFilterIni(e.target.value)} />
            </div>
            <div>
              <Label>Data Final</Label>
              <Input type="date" value={filterFim} onChange={(e) => setFilterFim(e.target.value)} />
            </div>
            <div className="col-span-2 flex items-end justify-end">
              <Button variant="ghost" onClick={() => { setFilterIni(""); setFilterFim(""); }}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="border">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-center align-middle text-primary">Data Inicial</TableHead>
                  <TableHead className="text-center align-middle text-primary">Data Final</TableHead>
                  <TableHead className="text-center align-middle text-primary">Arquivo</TableHead>
                  <TableHead className="text-center align-middle text-primary">Upload</TableHead>
                  <TableHead className="text-center align-middle text-primary">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center align-middle">Carregando...</TableCell></TableRow>
                ) : filtrarLista().length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-muted-foreground text-center align-middle">Nenhum formulário encontrado</TableCell></TableRow>
                ) : (
                  filtrarLista().map((item) => (
                    <TableRow key={item._id} className="hover:bg-muted/50">
                      <TableCell className="text-center align-middle">{item.data_inicial ? new Date(item.data_inicial + 'T00:00:00').toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-center align-middle">{item.data_final ? new Date(item.data_final + 'T00:00:00').toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-center align-middle">{item.filename}</TableCell>
                      <TableCell className="text-center align-middle">{item.uploadDate ? new Date(item.uploadDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="icon" onClick={() => visualizar(item._id)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => baixar(item._id, item.filename)}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => excluir(item._id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
