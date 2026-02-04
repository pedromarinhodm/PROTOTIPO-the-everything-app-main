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
import { Plus, Search, Pencil, Trash2, Package, FileText, Eye, Download } from "lucide-react";
import { toast } from "sonner";

type ProductFormData = {
  descricao: string;
  quantidade: string;
  unidade: string;
  descricao_complementar: string;
  validade: string;
  fornecedor: string;
  numero_processo: string;
  observacoes: string;
  nota_fiscal?: File;
  imagens?: FileList;
};

const ProductForm = ({ formData, setFormData, isEdit = false }: { formData: ProductFormData; setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>; isEdit?: boolean }) => (
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
        <Label htmlFor="quantidade">Quantidade *</Label>
        <Input
          id="quantidade"
          type="number"
          value={formData.quantidade}
          onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
          placeholder="0"
          min="0"
        />
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



  const [formData, setFormData] = useState({
    descricao: "",
    quantidade: "",
    unidade: "UN",
    descricao_complementar: "",
    validade: "",
    fornecedor: "",
    numero_processo: "",
    observacoes: "",
  });

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.getAll();
      setProducts(data);
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.fornecedor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.codigo.toString().includes(searchQuery)
  );

  const resetForm = () => {
    setFormData({
      descricao: "",
      quantidade: "",
      unidade: "UN",
      descricao_complementar: "",
      validade: "",
      fornecedor: "",
      numero_processo: "",
      observacoes: "",
    });
  };


  const handleEdit = async () => {
    if (!editingProduct || !formData.descricao.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      const updatedProduct = await api.products.update(editingProduct._id, {
        descricao: formData.descricao,
        quantidade: parseInt(formData.quantidade) || editingProduct.quantidade,
        unidade: formData.unidade,
        descricao_complementar: formData.descricao_complementar || undefined,
        validade: formData.validade || undefined,
        fornecedor: formData.fornecedor || undefined,
        numero_processo: formData.numero_processo || undefined,
        observacoes: formData.observacoes || undefined,
      });

      setProducts(prev => prev.map(p => p._id === editingProduct._id ? updatedProduct : p));
      toast.success("Produto atualizado com sucesso!");
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      toast.error("Erro ao atualizar produto");
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
      quantidade: String(product.quantidade),
      unidade: product.unidade,
      descricao_complementar: product.descricao_complementar || "",
      validade: product.validade || "",
      fornecedor: product.fornecedor || "",
      numero_processo: product.numero_processo || "",
      observacoes: product.observacoes || "",
    });
    setIsEditDialogOpen(true);
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
              await api.reports.downloadStockPDF();
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
                            product.quantidade <= 30
                              ? "text-destructive font-semibold"
                              : "text-accent font-semibold"
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
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Código: {editingProduct?.codigo}
            </DialogDescription>
          </DialogHeader>
          <ProductForm formData={formData} setFormData={setFormData} isEdit />
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
