import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";

interface dataCardProps {
  value: number;
  label: string;
  shouldFormat?: boolean ;
}

export const DataCard = ({ label, value, shouldFormat }: dataCardProps) => {
  return ( <div className="p-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl">
    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
      <h3 className="text-sm font-medium text-gray-400">
        {label}
      </h3>
    </div>
    <div className="pt-2">
        <div className="text-2xl font-bold text-white">
            {shouldFormat? formatPrice(value) : value}
        </div>
    </div>
  </div>);
};
