"use client";

import { useState, useEffect } from "react";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Product, Movement, DashboardStats } from "@/types/stock";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalEntries: 0,
    totalExits: 0,
    lowStockProducts: 0,
    totalMovements: 0,
  });
  const [recentMovements, setRecentMovements] = useState<Movement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, movementsData, productsData] = await Promise.all([
          api.dashboard.getStats(),
          api.dashboard.getRecentMovements(5),
          api.dashboard.getLowStockProducts(5),
        ]);

        setStats(statsData);
        setRecentMovements(movementsData);
        setLowStockProducts(productsData);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Visao geral do estoque e movimentacoes"
      />

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Produtos"
          value={loading ? 0 : stats.totalProducts}
          icon={Package}
          variant="primary"
          description="Itens cadastrados"
        />
        <StatsCard
          title="Total de Entradas"
          value={loading ? 0 : stats.totalEntries}
          icon={ArrowDownToLine}
          variant="accent"
          description="Unidades recebidas"
        />
        <StatsCard
          title="Total de Saidas"
          value={loading ? 0 : stats.totalExits}
          icon={ArrowUpFromLine}
          variant="destructive"
          description="Unidades distribuidas"
        />
        <StatsCard
          title="Estoque Baixo"
          value={loading ? 0 : stats.lowStockProducts}
          icon={AlertTriangle}
          variant="warning"
          description={"Produtos com \u226430%"}
        />
      </div>

      {/* Charts Section - positioned right after stats */}
      <DashboardCharts />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-primary" />
              Movimentacoes Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma movimentacao registrada
              </p>
            ) : (
              <div className="space-y-3">
                {recentMovements.map((movement) => (
                  <div
                    key={movement._id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          movement.tipo === "entrada"
                            ? "default"
                            : "destructive"
                        }
                        className="capitalize"
                      >
                        {movement.tipo}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {movement.produto_id.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(movement.data), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {movement.tipo === "entrada" ? "+" : "-"}
                      {movement.quantidade}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-chart-4" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum produto com estoque baixo
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-lg border border-chart-4/30 bg-chart-4/5 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {"Codigo: "}
                        {product.codigo}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-chart-4 text-chart-4"
                    >
                      {product.quantidade} {product.unidade}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Welcome message if empty */}
      {stats.totalProducts === 0 && !loading && (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {"Bem-vindo ao SCGES!"}
            </h3>
            <p className="max-w-md text-muted-foreground">
              {
                "Sistema de Controle e Gerenciamento de Estoque da SEMSC. Comece cadastrando produtos ou registrando entradas no almoxarifado."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
