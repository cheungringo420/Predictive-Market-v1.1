import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import type { PricePoint } from '../hooks/useMarketHistory';

interface PriceHistoryChartProps {
    data: PricePoint[];
    isLoading: boolean;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps & { color?: string, dataKey?: string }> = ({ data, isLoading, color = '#10B981', dataKey = 'yesPrice' }) => {
    if (isLoading) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center bg-brand-bg/30 rounded-lg animate-pulse">
                <span className="text-brand-muted">Loading chart data...</span>
            </div>
        );
    }

    // Handle sparse data
    let chartData = [...data];
    if (chartData.length === 1) {
        // If only one point, add a second point slightly earlier/later to make a line
        // Or better, add a "start" point if the single point is recent?
        // Let's just duplicate it to show a flat line for now
        chartData = [
            { date: new Date(chartData[0].date.getTime() - 3600000), [dataKey]: (chartData[0] as any)[dataKey] },
            ...chartData
        ];
    } else if (chartData.length === 0) {
        return (
            <div className="h-[200px] w-full flex items-center justify-center bg-brand-bg/30 rounded-lg">
                <span className="text-brand-muted">No trading history yet.</span>
            </div>
        );
    }

    // Calculate min/max for Y-axis domain to make chart look better
    // But for prediction markets, 0-100 is standard.

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-brand-surface border border-brand-border p-2 rounded shadow-lg text-xs">
                    <p className="text-brand-muted mb-1">{format(new Date(label), 'MMM d, HH:mm')}</p>
                    <p className="text-white font-bold">
                        Price: <span style={{ color }}>{payload[0].value.toFixed(1)}¢</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        stroke="#6B7280"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[0, 100]}
                        hide={true} // Hide Y axis for cleaner look, or show minimal
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={50} stroke="#4B5563" strokeDasharray="3 3" opacity={0.5} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: color }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
