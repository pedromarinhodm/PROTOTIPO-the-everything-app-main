import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpFromLine, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "@/services/api";
import { Product } from "@/services/api";

const PREDEFINED_SETORES = [
  "Gabinete do Secretario",
  "Assessoria de Apoio",
  "Assessoria de Comunicacao",
  "Assessoria Tecnica Juridico-Legislativa",
  "Superintendencia de Governanca e Gestao Interna",
  "Gerencia Tecnica de Gestao de Pessoal",
  "Gerencia Tecnica de Gestao Administrativa, Projetos e Convenios",
  "Gerencia Tecnica de Suprimentos, Licitacoes e Contratos",
  "Gerencia Tecnica de Gestao Patrimonial e Transporte",
  "Gerencia Tecnica de Gestao Orcamentaria e Financeira",
  "Gerencia Tecnica de Contabilidade, Prestacao de Contas e Controle",
  "Gerencia Tecnica de Infraestrutura e Tecnologica da Rede",
  "Subsecretaria de Seguranca Cidada",
  "Corregedoria Geral da Guarda Municipal",
  "Ouvidoria Geral da Guarda Municipal",
  "Coordenacao Geral do Centro de Operacoes e Inteligencia",
  "Gerencia Tecnica de Ensino e Instrucao",
  "Subsecretaria de Convivio Social",
  "Diretoria de Licenciamento e Fiscalizacao de Posturas",
  "Coordenacao Geral de Controle de Atividades no Espaco Publico e de Processos Especiais",
  "Gerencia de Autorizacao para o Exercicio de Atividades em Logradouros Publicos",
  "Gerencia de Analise e Licenciamento de Evento e Publicidade",
  "Coordenacao Geral de Fiscalizacao de Posturas",
  "Nucleo de Gerencias de Posturas Fiscalizacao de Posturas",
  "Gerencia Tecnica de Fiscalizacao de Comercio de Ambulantes e Permissionarios",
  "Gerencia de Conservacao e Guarda de Bens Apreendidos e Demolicao",
];

export default function Exits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    productId: "",
    quantidade: "",
    servidor_almoxarifado: "",
    data: format(new Date(), "yyyy-MM-dd"),
    setor_responsavel: "",
    servidor_retirada: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.products.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(p => p._id === formData.productId);
  const availableQuantity = selectedProduct?.quantidade || 0;

  const resetForm = () => {
    setFormData({
      productId: "",
      quantidade: "",
      servidor_almoxarifado: "",
      data: format(new Date(), "yyyy-MM-dd"),
      setor_responsavel: "",
      servidor_retirada: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productId) {
      toast.error("Selecione um produto");
      return;
    }
    if (!formData.quantidade || parseInt(formData.quantidade) <= 0) {
      toast.error("Informe uma quantidade valida");
      return;
    }
    if (!formData.servidor_almoxarifado.trim()) {
      toast.error("Informe o servidor do almoxarifado");
      return;
    }
    if (parseInt(formData.quantidade) > availableQuantity) {
      toast.error("Quantidade maior que o estoque disponivel");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.movements.createExit({
        produto_id: formData.productId,
        quantidade: parseInt(formData.quantidade),
        servidor_almoxarifado: formData.servidor_almoxarifado.trim(),
        data: formData.data,
        setor_responsavel: formData.setor_responsavel.trim() || undefined,
        servidor_retirada: formData.servidor_retirada.trim() || undefined,
      });

      toast.success("Saida registrada com sucesso!");
      resetForm();
      loadProducts();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error("Erro ao registrar saida: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Registro de Saidas"
        description="Registre a saida de materiais do almoxarifado"
      />

      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <ArrowUpFromLine className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>Nova Saida</CardTitle>
                <CardDescription>
                  Selecione o produto e informe os dados do requisitante
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Selecao do Produto
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="product">Produto *</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, productId: value, quantidade: "" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhum produto cadastrado
                          </SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product._id} value={product._id}>
                              {product.codigo} - {product.descricao} ({product.quantidade} {product.unidade})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProduct && (
                    <div className="sm:col-span-2 rounded-lg border bg-muted/50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Estoque disponivel:
                        </span>
                        <span className="font-semibold">
                          {availableQuantity} {selectedProduct.unidade}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={availableQuantity}
                      value={formData.quantidade}
                      onChange={(e) =>
                        setFormData({ ...formData, quantidade: e.target.value })
                      }
                      placeholder="0"
                      disabled={!selectedProduct}
                    />
                    {formData.quantidade !== "" && parseInt(formData.quantidade) > availableQuantity && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Quantidade maior que o estoque
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Responsaveis
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="warehouseServer">Servidor Almoxarifado *</Label>
                    <Input
                      id="warehouseServer"
                      value={formData.servidor_almoxarifado}
                      onChange={(e) =>
                        setFormData({ ...formData, servidor_almoxarifado: e.target.value })
                      }
                      placeholder="Nome do servidor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestingSector">Setor Requisitante</Label>
                    <Select
                      value={formData.setor_responsavel || "_none_"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, setor_responsavel: value === "_none_" ? "" : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor" />
                      </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">Nenhum setor</SelectItem>
                      {PREDEFINED_SETORES.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>

                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestingServer">Servidor Requisitante</Label>
                    <Input
                      id="requestingServer"
                      value={formData.servidor_retirada}
                      onChange={(e) =>
                        setFormData({ ...formData, servidor_retirada: e.target.value })
                      }
                      placeholder="Nome do servidor"
                    />
                  </div>
                </div>
              </div>

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
                  disabled={isSubmitting || !selectedProduct}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Registrar Saida
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
