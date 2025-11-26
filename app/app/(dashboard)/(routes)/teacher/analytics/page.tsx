import { getAnalytics } from "@/actions/get-analytics";
import { auth } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { DataCard } from "./_components/data-card";
import { Chart } from "./_components/chart";

const AnalyticsPage = async () => {
  const user = await auth();
  if (!user) {
    return redirect("/login");
  }

  const { data, totalRevenue, totalSales } = await getAnalytics(user.userId);

  return <div className="p-6 bg-[#0f0f0f] min-h-screen">
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2 text-white">Analytics</h1>
      <p className="text-gray-400">View your course analytics and performance</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <DataCard
    label="Total Revenue"
    value={totalRevenue}
    shouldFormat/>
    <DataCard
    label="Total Sales"
    value={totalSales}/>
    </div>
    <Chart data={data} />
  </div>;
};

export default AnalyticsPage;
