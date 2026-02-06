import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Menu,
  X,
  Shield,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Entradas", href: "/entradas", icon: ArrowDownToLine },
  { name: "Saídas", href: "/saidas", icon: ArrowUpFromLine },
  { name: "Histórico", href: "/historico", icon: History },
  { name: "Formulários", href: "/formularios", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toggle button for mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-accent">
            <Shield className="h-6 w-6 text-sidebar-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-sidebar-foreground">SCGES</span>
            <span className="text-xs text-sidebar-foreground/70">SEMSC Maceió</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/70">
              Sistema de Controle e Gerenciamento de Estoque
            </p>
            <p className="mt-1 text-xs font-medium text-sidebar-foreground">
              Versão 1.2.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
