"use client"

import { Card } from "@/components/ui/card"
import {
Bar,
BarChart,
ResponsiveContainer,
XAxis,
YAxis
} from "recharts"


interface chartProps{
    data: {
        name: string,
        total: number
    }[]
}


export const Chart = ({data}: chartProps) => {
    return(
      <div className="p-6 bg-[#1a1a1a] border border-gray-800 rounded-2xl">
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data} >
                <XAxis
                dataKey="name"
                stroke="#a8b2d1"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                stroke="#a8b2d1"
                />

                <Bar 
                dataKey="total"
                fill="#00d4ff"
                radius={[4,4,0,0]} />
            </BarChart>
        </ResponsiveContainer>
      </div>
    )
}