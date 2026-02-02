import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History as HistoryIcon,
  Search,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Movement, MovementFilter } from "@/types/stock";
import { toast } from "sonner";

export default function History() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<MovementFilter>({
    search: "",
    tipo: "all",
    startDate: "",
    endDate: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadMovements = async () => {
      try {
        setLoading(true);
        const data = await api.movements.getAll({
          search: filter.search || undefined,
          tipo: filter.tipo !== "all" ? filter.tipo : undefined,
          startDate: filter.startDate || undefined,
          endDate: filter.endDate || undefined,
        });
        setMovements(data);
      } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMovements();
  }, [filter]);

  const filteredMovements = useMemo(() => {
    return movements;
  }, [movements]);

  const stats = useMemo(() => {
    const entries = filteredMovements.filter((m) => m.tipo === "entrada");
    const exits = filteredMovements.filter((m) => m.tipo === "saida");

    return {
      totalEntries: entries.reduce((sum, m) => sum + m.quantidade, 0),
      totalExits: exits.reduce((sum, m) => sum + m.quantidade, 0),
      balance: entries.reduce((sum, m) => sum + m.quantidade, 0) - exits.reduce((sum, m) => sum + m.quantidade, 0),
      count: filteredMovements.length,
    };
  }, [filteredMovements]);

  const clearFilters = () => {
    setFilter({
      search: "",
      tipo: "all",
      startDate: "",
      endDate: "",
    });
  };

  const generateReport = async () => {
    try {
      await api.reports.downloadHistoryPDF({
        type: filter.tipo !== "all" ? filter.tipo : undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
        search: filter.search || undefined,
      });
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório PDF:", error);
      toast.error("Erro ao gerar relatório");
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Histórico de Movimentações"
        description="Visualize todas as entradas e saídas registradas"
        action={
          <Button onClick={generateReport} disabled={filteredMovements.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Gerar Relatório
          </Button>
        }
      />

      {/* Dashboard Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <ArrowDownToLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-accent">{stats.totalEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <ArrowUpFromLine className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-info">{stats.totalExits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <HistoryIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? "text-accent" : "text-destructive"}`}>
                  {stats.balance >= 0 ? "+" : ""}{stats.balance}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Ocultar" : "Mostrar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search - Always visible */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto..."
              value={filter.search || ""}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid gap-4 sm:grid-cols-4 pt-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filter.tipo || "all"}
                  onValueChange={(value) =>
                    setFilter({ ...filter, tipo: value as "entrada" | "saida" | "all" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data Inicial</Label>
                <Input
                  type="date"
                  value={filter.startDate || ""}
                  onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Final</Label>
                <Input
                  type="date"
                  value={filter.endDate || ""}
                  onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card>
        <CardContent className="p-0">
          {filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HistoryIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {movements.length === 0
                  ? "Nenhuma movimentação registrada"
                  : "Nenhuma movimentação encontrada com os filtros aplicados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-28 text-center align-middle text-primary">Data</TableHead>
                    <TableHead className="w-24 text-center align-middle text-primary">Tipo</TableHead>
                    <TableHead className="text-center align-middle text-primary">Produto</TableHead>
                    <TableHead className="w-20 text-center align-middle text-primary">Qtd</TableHead>
                    <TableHead className="text-center align-middle text-primary">Servidor Almoxarifado</TableHead>
                    <TableHead className="text-center align-middle text-primary">Setor / Servidor Retirada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement._id} className="hover:bg-muted/50">
                      <TableCell className="text-sm text-center align-middle">
                        {format(new Date(movement.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Badge
                          variant={movement.tipo === "entrada" ? "default" : "secondary"}
                          className={
                            movement.tipo === "entrada"
                              ? "bg-accent text-accent-foreground"
                              : "bg-info text-info-foreground"
                          }
                        >
                          {movement.tipo === "entrada" ? (
                            <ArrowDownToLine className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowUpFromLine className="mr-1 h-3 w-3" />
                          )}
                          {movement.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-center align-middle">
                        {movement.produto_id.descricao}
                      </TableCell>
                      <TableCell className="text-center font-semibold align-middle">
                        {movement.tipo === "entrada" ? "+" : "-"}{movement.quantidade}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center align-middle">
                        {movement.servidor_almoxarifado}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-center align-middle">
                        {movement.setor_responsavel
                          ? `${movement.setor_responsavel} / ${movement.servidor_retirada}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {filteredMovements.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Exibindo {filteredMovements.length} movimentação{filteredMovements.length !== 1 ? "ões" : ""}
        </p>
      )}
    </MainLayout>
  );
}
