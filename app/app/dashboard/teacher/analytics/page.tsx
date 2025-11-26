"use client";

import { useEffect, useState } from "react";
import { getAnalytics } from "@/actions/get-analytics";
import { useAuth } from "@/hooks/use-auth";
import { DataCard } from "@/app/(dashboard)/(routes)/teacher/analytics/_components/data-card";
import { Chart } from "@/app/(dashboard)/(routes)/teacher/analytics/_components/chart";
import { Loader2 } from "lucide-react";

const AnalyticsPage = () => {
  const { user, isLoading } = useAuth();
  const [analytics, setAnalytics] = useState<{
    data: any[];
    totalRevenue: number;
    totalSales: number;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchAnalytics = async () => {
        const data = await getAnalytics(user.id);
        setAnalytics(data);
      };
      fetchAnalytics();
    }
  }, [user]);

  if (isLoading || !user || !analytics) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <DataCard
          label="Total Revenue"
          value={analytics.totalRevenue}
          shouldFormat
        />
        <DataCard
          label="Total Sales"
          value={analytics.totalSales}
        />
      </div>
      <Chart data={analytics.data} />
    </div>
  );
};

export default AnalyticsPage;

