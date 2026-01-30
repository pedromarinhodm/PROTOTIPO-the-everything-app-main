import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Entries from "./pages/Entries";
import Exits from "./pages/Exits";
import History from "./pages/History";
import Formularios from "./pages/Formularios";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/entradas" element={<Entries />} />
            <Route path="/saidas" element={<Exits />} />
            <Route path="/historico" element={<History />} />
            <Route path="/formularios" element={<Formularios />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
