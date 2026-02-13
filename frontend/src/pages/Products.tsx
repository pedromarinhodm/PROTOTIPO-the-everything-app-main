import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { api, Product } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Package, FileText, Eye, Download, X, FileUp } from "lucide-react";
import { toast } from "sonner";

type ProductFormData = {
  descricao: string;
  unidade: string;
  descricao_complementar: string;
  validade: string;
  fornecedor: string;
  numero_processo: string;
  observacoes: string;
  nota_fiscal?: File | null;
};

const ProductForm = ({ formData, setFormData, isEdit = false, currentQuantity = 0 }: { formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>; isEdit?: boolean; currentQuantity?: number }) => (
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Nome do produto"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantidade">Quantidade em Estoque</Label>
        <Input
          id="quantidade"
          type="number"
          value={currentQuantity}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">Calculada automaticamente das movimentações</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="unidade">Unidade</Label>
        <Input
          id="unidade"
          value={formData.unidade}
          onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
          placeholder="UN, CX, KG..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="validade">Validade</Label>
        <Input
          id="validade"
          type="date"
          value={formData.validade}
          onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fornecedor">Fornecedor</Label>
        <Input
          id="fornecedor"
          value={formData.fornecedor}
          onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
          placeholder="Nome do fornecedor"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="numero_processo">Nº do Processo</Label>
        <Input
          id="numero_processo"
          value={formData.numero_processo}
          onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
          placeholder="Número do processo"
        />
      </div>
    </div>

    <div className="space-y-2">
      <Label htmlFor="descricao_complementar">Descrição Complementar</Label>
      <Input
        id="descricao_complementar"
        value={formData.descricao_complementar}
        onChange={(e) => setFormData({ ...formData, descricao_complementar: e.target.value })}
        placeholder="Informações adicionais"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="observacoes">Observações</Label>
      <Textarea
        id="observacoes"
        value={formData.observacoes}
        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
        placeholder="Observações adicionais"
        rows={3}
      />
    </div>
  </div>
);

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);



  const [formData, setFormData] = useState<ProductFormData>({
    descricao: "",
    unidade: "UN",
    descricao_complementar: "",
    validade: "",
    fornecedor: "",
    numero_processo: "",
    observacoes: "",
    nota_fiscal: null,
  });

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await api.products.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error("Erro ao carregar produtos");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = (products || [])
    .filter(product =>
      product.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.fornecedor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codigo.toString().includes(searchQuery)
    )
    .sort((a, b) => a.codigo - b.codigo);




  const resetForm = () => {
    setFormData({
      descricao: "",
      unidade: "UN",
      descricao_complementar: "",
      validade: "",
      fornecedor: "",
      numero_processo: "",
      observacoes: "",
      nota_fiscal: null,
    });
    setInvoiceFile(null);
  };


  const handleEdit = async () => {
    if (!editingProduct || !formData.descricao.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      let updatedProduct: Product;
      
      // Se há arquivo de nota fiscal, usa FormData
      if (invoiceFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('descricao', formData.descricao);
        formDataToSend.append('unidade', formData.unidade);
        if (formData.descricao_complementar) formDataToSend.append('descricao_complementar', formData.descricao_complementar);
        if (formData.validade) formDataToSend.append('validade', formData.validade);
        if (formData.fornecedor) formDataToSend.append('fornecedor', formData.fornecedor);
        if (formData.numero_processo) formDataToSend.append('numero_processo', formData.numero_processo);
        if (formData.observacoes) formDataToSend.append('observacoes', formData.observacoes);
        formDataToSend.append('nota_fiscal', invoiceFile);

        console.log('Enviando formulário com nota fiscal...');
        const result = await api.products.updateWithInvoice(editingProduct._id, formDataToSend);
        console.log('Resposta do servidor:', result);
        
        if (!result || !result.data) {
          throw new Error('Resposta inválida do servidor');
        }
        updatedProduct = result.data;
      } else {
        // Atualização sem arquivo
        const result = await api.products.update(editingProduct._id, {
          descricao: formData.descricao,
          unidade: formData.unidade,
          descricao_complementar: formData.descricao_complementar || undefined,
          validade: formData.validade || undefined,
          fornecedor: formData.fornecedor || undefined,
          numero_processo: formData.numero_processo || undefined,
          observacoes: formData.observacoes || undefined,
        });
        updatedProduct = result.produto;
      }

      console.log('Produto atualizado:', updatedProduct);
      setProducts(prev => prev.map(p => p._id === editingProduct._id ? updatedProduct : p));
      
      toast.success("Produto atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error("Erro ao atualizar produto: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const handleDelete = async () => {
    if (deleteProductId) {
      try {
        await api.products.delete(deleteProductId);
        setProducts(prev => prev.filter(p => p._id !== deleteProductId));
        toast.success("Produto excluído com sucesso!");
        setDeleteProductId(null);
      } catch (error) {
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      descricao: product.descricao,
      unidade: product.unidade,
      descricao_complementar: product.descricao_complementar || "",
      validade: product.validade || "",
      fornecedor: product.fornecedor || "",
      numero_processo: product.numero_processo || "",
      observacoes: product.observacoes || "",
      nota_fiscal: null,
    });
    setInvoiceFile(null);
    setIsEditDialogOpen(true);
  };

  const handleViewInvoice = (product: Product) => {
    if (product.nota_fiscal_id) {
      window.open(api.products.getInvoiceViewUrl(product._id), '_blank');
    }
  };

  const handleDownloadInvoice = async (product: Product) => {
    if (product.nota_fiscal_id) {
      try {
        const response = await fetch(api.products.getInvoiceDownloadUrl(product._id));
        if (!response.ok) throw new Error('Erro ao baixar nota fiscal');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = product.nota_fiscal_filename || 'nota-fiscal.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Nota fiscal baixada com sucesso!");
      } catch (error) {
        toast.error("Erro ao baixar nota fiscal");
      }
    }
  };

  const handleRemoveInvoice = () => {
    setInvoiceFile(null);
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        nota_fiscal_id: undefined,
        nota_fiscal_filename: undefined,
      });
    }
  };

  const openDetailsDialog = (product: Product) => {
    setViewingProduct(product);
    setIsDetailsDialogOpen(true);
  };



  return (
    <MainLayout>
      <PageHeader
        title="Gestão de Produtos"
        description="Cadastre, edite e gerencie os produtos do estoque"
        action={
          <Button onClick={async () => {
            try {
              await api.reports.getStockPDF();
              toast.success("Relatório gerado com sucesso!");
            } catch (error) {
              toast.error("Erro ao gerar relatório");
            }
          }}>
            <Download className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        }
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, código ou fornecedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-20 text-center align-middle text-primary">Código</TableHead>
                    <TableHead className="text-center align-middle text-primary">Descrição</TableHead>
                    <TableHead className="w-24 text-center align-middle text-primary">Qtd</TableHead>
                    <TableHead className="w-20 text-center align-middle text-primary">Unidade</TableHead>
                    <TableHead className="text-center align-middle text-primary">Fornecedor</TableHead>
                    <TableHead className="w-32 text-center align-middle text-primary">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm text-center align-middle">{product.codigo}</TableCell>
                      <TableCell className="font-medium text-center align-middle">{product.descricao}</TableCell>
                      <TableCell className="text-center align-middle">
                        <span
                          className={
                            (product.totalEntradas || 0) > 0 && product.quantidade <= (product.totalEntradas || 0) * 0.30
                              ? "text-red-500 font-semibold"
                              : "text-green-500 font-semibold"
                          }
                        >
                          {product.quantidade}
                        </span>
                      </TableCell>

                      <TableCell className="text-center align-middle">{product.unidade}</TableCell>
                      <TableCell className="text-muted-foreground text-center align-middle">
                        {product.fornecedor || "-"}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(product)}
                            title="Ver detalhes"
                            className="hover:bg-green-500"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            title="Editar"
                            className="hover:bg-blue-500"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-red-400"
                            onClick={() => setDeleteProductId(product._id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Código: {editingProduct?.codigo}
          </DialogDescription>
        </DialogHeader>
        <ProductForm formData={formData} setFormData={setFormData} isEdit currentQuantity={editingProduct?.quantidade || 0} />

          
          {/* Seção de Nota Fiscal */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-semibold mb-3 block">Nota Fiscal (PDF)</Label>
            
            {/* Nota Fiscal Existente */}
            {editingProduct?.nota_fiscal_id && !invoiceFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg mb-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {editingProduct.nota_fiscal_filename || 'Nota fiscal anexada'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewInvoice(editingProduct)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice(editingProduct)}
                    title="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveInvoice}
                    title="Remover"
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload de Nova Nota Fiscal */}
            <div className="space-y-2">
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.type !== 'application/pdf') {
                      toast.error('Apenas arquivos PDF são permitidos');
                      return;
                    }
                    setInvoiceFile(file);
                  }
                }}
                className="hidden"
                id="nota-fiscal-upload"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('nota-fiscal-upload')?.click()}
                  className="w-full"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {invoiceFile ? 'Trocar arquivo' : (editingProduct?.nota_fiscal_id ? 'Substituir nota fiscal' : 'Anexar nota fiscal')}
                </Button>
              </div>
              
              {/* Preview do arquivo selecionado */}
              {invoiceFile && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="flex-1 truncate">{invoiceFile.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInvoiceFile(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF (máx. 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este produto? Esta ação também removerá
              todas as movimentações relacionadas e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
