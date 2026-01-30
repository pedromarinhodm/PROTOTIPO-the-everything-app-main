import { useState, useEffect } from "react";
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Activity } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Product, Movement, DashboardStats } from "@/types/stock";

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
          api.movements.getAll({ limit: 5 }),
          api.products.getAll(),
        ]);

        setStats(statsData);
        setRecentMovements(movementsData);
        setLowStockProducts(productsData.filter((p) => p.quantidade <= 5).slice(0, 5));
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
        description="Visão geral do estoque e movimentações"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
          title="Total de Saídas"
          value={loading ? 0 : stats.totalExits}
          icon={ArrowUpFromLine}
          variant="info"
          description="Unidades distribuídas"
        />
        <StatsCard
          title="Estoque Baixo"
          value={loading ? 0 : stats.lowStockProducts}
          icon={AlertTriangle}
          variant="warning"
          description="Produtos com ≤5 unidades"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Movements */}
        <Card className="animate-slide-in-left">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma movimentação registrada
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
                        variant={movement.tipo === "entrada" ? "default" : "destructive"}
                        className="capitalize"
                      >
                        {movement.tipo}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {movement.produto_id.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(movement.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-sm">
                      {movement.tipo === "entrada" ? "+" : "-"}{movement.quantidade}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alertas de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum produto com estoque baixo
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{product.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        Código: {product.codigo}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">
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
      {stats.totalProducts === 0 && (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bem-vindo ao SCGES!</h3>
            <p className="text-muted-foreground max-w-md">
              Sistema de Controle e Gerenciamento de Estoque da SEMSC. 
              Comece cadastrando produtos ou registrando entradas no almoxarifado.
            </p>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
