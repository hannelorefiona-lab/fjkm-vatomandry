import { AdidyManager } from "@/components/adherents/AdidyManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Calendar } from "lucide-react";

export default function Mpandray() {
  return (
    <div className="space-y-6">
      {/* Gestionnaire principal */}
      <AdidyManager />
    </div>
  );
}