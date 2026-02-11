"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  BarChart3,
  FileDown,
  Filter,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { api } from "@/services/api";
import type { Product, Movement, ChartDataPoint, ChartFilters } from "@/types/stock";
import { cn } from "@/lib/utils";

const CHART_COLORS = {
  entradas: "hsl(var(--accent))",
  saidas: "hsl(var(--destructive))",
};


function groupMovementsByDate(movements: Movement[]): ChartDataPoint[] {
  const grouped: Record<string, { entradas: number; saidas: number }> = {};

  for (const movement of movements) {
    const dateKey = format(new Date(movement.data), "dd/MM", { locale: ptBR });
    if (!grouped[dateKey]) {
      grouped[dateKey] = { entradas: 0, saidas: 0 };
    }
    if (movement.tipo === "entrada") {
      grouped[dateKey].entradas += movement.quantidade;
    } else {
      grouped[dateKey].saidas += movement.quantidade;
    }
  }

  return Object.entries(grouped).map(([name, values]) => ({
    name,
    ...values,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-md">
      <p className="mb-2 text-sm font-medium text-card-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <div
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-semibold text-card-foreground">
            {entry.value.toLocaleString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts() {
  const [isOpen, setIsOpen] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [setores, setSetores] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<ChartFilters>({
    startDate: undefined,
    endDate: undefined,
    tipo: "ambos",
    productId: "todos",
    setor: "todos",
  });

  // Load products and setores for filter options
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [productsResponse, setoresData] = await Promise.all([
          api.products.getAll(),
          api.setores.getAll(),
        ]);
        setProducts(productsResponse.data || []);
        setSetores(setoresData || []);
      } catch (error) {
        console.error("Erro ao carregar opcoes de filtro:", error);
      }
    }
    loadFilterOptions();
  }, []);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      const movements = await api.movements.getFiltered({
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        tipo: filters.tipo,
        productId: filters.productId,
        setor: filters.setor,
      });
      const grouped = groupMovementsByDate(movements);
      setChartData(grouped);
    } catch (error) {
      console.error("Erro ao carregar dados do grafico:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Reload chart data whenever filters change
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const handleExportPDF = useCallback(async () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    // Dynamically import html2canvas and jspdf
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(chartElement, {
      backgroundColor: "#ffffff",
      scale: 2,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(16);
    pdf.text("SCGES - Relatorio de Movimentacoes", 14, 15);

    // Filter info
    pdf.setFontSize(10);
    const filterLines: string[] = [];
    if (filters.startDate) {
      filterLines.push(
        `Periodo: ${format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })} - ${filters.endDate ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR }) : "Atual"}`
      );
    }
    if (filters.tipo !== "ambos") {
      filterLines.push(`Tipo: ${filters.tipo === "entrada" ? "Entradas" : "Saidas"}`);
    }
    if (filters.productId !== "todos") {
      const product = products.find((p) => p._id === filters.productId);
      if (product) filterLines.push(`Produto: ${product.descricao}`);
    }
    if (filters.setor !== "todos") {
      filterLines.push(`Setor: ${filters.setor}`);
    }
    if (filterLines.length === 0) {
      filterLines.push("Filtros: Todos os dados");
    }
    filterLines.forEach((line, i) => {
      pdf.text(line, 14, 23 + i * 5);
    });

    // Chart image
    const yOffset = 25 + filterLines.length * 5;
    const imgWidth = pageWidth - 28;
    const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, pageHeight - yOffset - 10);
    pdf.addImage(imgData, "PNG", 14, yOffset, imgWidth, imgHeight);

    // Generated timestamp
    pdf.setFontSize(8);
    pdf.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      14,
      pageHeight - 5
    );

    pdf.save(`relatorio-movimentacoes-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  }, [filters, products]);

  const updateFilter = <K extends keyof ChartFilters>(
    key: K,
    value: ChartFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const totalEntradas = chartData.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas = chartData.reduce((sum, d) => sum + d.saidas, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Graficos de Movimentacoes
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="gap-1.5 bg-transparent"
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar PDF</span>
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                {isOpen ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Ocultar</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Mostrar</span>
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Filter className="h-4 w-4" />
                Filtros
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Date Start */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filters.startDate
                          ? format(filters.startDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.startDate}
                        onSelect={(date) => updateFilter("startDate", date ?? undefined)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date End */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {filters.endDate
                          ? format(filters.endDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.endDate}
                        onSelect={(date) => updateFilter("endDate", date ?? undefined)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Type Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select
                    value={filters.tipo}
                    onValueChange={(value) =>
                      updateFilter("tipo", value as ChartFilters["tipo"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambos">Ambos</SelectItem>
                      <SelectItem value="entrada">Entradas</SelectItem>
                      <SelectItem value="saida">Saidas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Produto</Label>
                  <Select
                    value={filters.productId}
                    onValueChange={(value) => updateFilter("productId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Produto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Produtos</SelectItem>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Setor Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Setor</Label>
                  <Select
                    value={filters.setor}
                    onValueChange={(value) => updateFilter("setor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Setores</SelectItem>
                      {setores.map((setor) => (
                        <SelectItem key={setor} value={setor}>
                          {setor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() =>
                      setFilters({
                        startDate: undefined,
                        endDate: undefined,
                        tipo: "ambos",
                        productId: "todos",
                        setor: "todos",
                      })
                    }
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-md bg-accent/10 px-3 py-1.5 text-sm">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.entradas }} />
                <span className="text-muted-foreground">Entradas:</span>
                <span className="font-semibold text-black-foreground">
                  {totalEntradas.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-1.5 text-sm">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.saidas }} />
                <span className="text-muted-foreground">Saidas:</span>
                <span className="font-semibold text-black-foreground">
                  {totalSaidas.toLocaleString("pt-BR")}
                </span>
              </div>

            </div>

            {/* Chart */}
            <div ref={chartRef} className="rounded-lg border bg-card p-4">
              {loading ? (
                <div className="flex h-[350px] items-center justify-center">
                  <div className="text-sm text-muted-foreground">Carregando grafico...</div>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex h-[350px] flex-col items-center justify-center text-center">
                  <BarChart3 className="mb-2 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum dado encontrado para os filtros selecionados
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
                      formatter={(value: string) =>
                        value === "entradas" ? "Entradas" : "Saidas"
                      }
                    />
                    {(filters.tipo === "ambos" || filters.tipo === "entrada") && (
                      <Bar
                        dataKey="entradas"
                        name="entradas"
                        fill={CHART_COLORS.entradas}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    )}
                    {(filters.tipo === "ambos" || filters.tipo === "saida") && (
                      <Bar
                        dataKey="saidas"
                        name="saidas"
                        fill={CHART_COLORS.saidas}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
