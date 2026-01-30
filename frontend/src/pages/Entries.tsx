import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownToLine, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "@/services/api";

export default function Entries() {
  
  const [formData, setFormData] = useState({
    produto: "",
    quantidade: "",
    data: format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      produto: "",
      quantidade: "",
      data: format(new Date(), "yyyy-MM-dd"),
      observacoes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.produto.trim()) {
      toast.error("Informe a descrição do produto");
      return;
    }
    if (!formData.quantidade || parseInt(formData.quantidade) <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }
    if (!formData.data) {
      toast.error("Informe a data da entrada");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.movements.createSimplifiedEntry({
        produto: formData.produto.trim(),
        quantidade: parseInt(formData.quantidade),
        data: formData.data,
        observacoes: formData.observacoes.trim() || undefined,
      });

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Entrada registrada com sucesso!</span>
        </div>
      );
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error("Erro ao registrar entrada: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Registro de Entradas"
        description="Registre a entrada de materiais no almoxarifado"
      />

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <ArrowDownToLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle>Nova Entrada</CardTitle>
                <CardDescription>
                  Se o produto já existir, a quantidade será incrementada automaticamente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Informações do Produto
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="produto">Descrição do Produto *</Label>
                    <Input
                      id="produto"
                      value={formData.produto}
                      onChange={(e) =>
                        setFormData({ ...formData, produto: e.target.value })
                      }
                      placeholder="Ex: Caneta esferográfica azul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade *</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Entry Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Dados da Entrada
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="servidor_almoxarifado">Servidor Almoxarifado *</Label>
                    <Input
                      id="servidor_almoxarifado"
                      value={formData.servidor_almoxarifado}
                      onChange={(e) =>
                        setFormData({ ...formData, servidor_almoxarifado: e.target.value })
                      }
                      placeholder="Nome do servidor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_entrada">Data *</Label>
                    <Input
                      id="data_entrada"
                      type="date"
                      value={formData.data_entrada}
                      onChange={(e) =>
                        setFormData({ ...formData, data_entrada: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 sm:flex-none"
                >
                  Limpar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Registrar Entrada
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
