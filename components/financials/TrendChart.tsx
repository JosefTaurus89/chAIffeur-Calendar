
import React from 'react';

interface TrendData {
    label: string;
    revenue: number;
    profit: number;
}

interface TrendChartProps {
    data: TrendData[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">No data available for trends.</div>;
    }

    // Dimensions
    const width = 800;
    const height = 300;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // Scales
    const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.profit)), 100) * 1.15; // Add 15% buffer
    
    const getX = (index: number) => padding + (index * (chartWidth / (data.length - 1)));
    const getY = (value: number) => height - padding - ((value / maxVal) * chartHeight);

    // Path Generators
    const createPath = (key: 'revenue' | 'profit') => {
        if (data.length < 2) return '';
        return data.map((d, i) => 
            `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key])}`
        ).join(' ');
    };

    // Area Generator for Revenue (Gradient Fill)
    const createArea = () => {
        if (data.length < 2) return '';
        let path = `M ${getX(0)} ${height - padding}`; // Start bottom left
        data.forEach((d, i) => {
            path += ` L ${getX(i)} ${getY(d.revenue)}`;
        });
        path += ` L ${getX(data.length - 1)} ${height - padding} Z`; // Close path
        return path;
    };

    const revenuePath = createPath('revenue');
    const profitPath = createPath('profit');
    const revenueArea = createArea();

    return (
        <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Financial Performance Trend</h3>
                <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        <span className="text-slate-600 dark:text-slate-400">Revenue</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                        <span className="text-slate-600 dark:text-slate-400">Net Profit</span>
                    </div>
                </div>
             </div>
            
            <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const y = height - padding - (t * chartHeight);
                        return (
                            <g key={t}>
                                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" className="dark:stroke-slate-700" />
                                <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-medium">
                                    ${Math.round(t * maxVal).toLocaleString()}
                                </text>
                            </g>
                        );
                    })}

                    {/* Revenue Area Fill */}
                    <path d={revenueArea} fill="url(#revenueGradient)" stroke="none" />

                    {/* Data Lines */}
                    <path d={revenuePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={profitPath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Data Points & Tooltips */}
                    {data.map((d, i) => (
                        <g key={i} className="group">
                            {/* Invisible hit area for better hover */}
                            <rect x={getX(i) - 10} y={padding} width="20" height={height - 2 * padding} fill="transparent" />
                            
                            {/* Vertical Guide Line on Hover */}
                            <line 
                                x1={getX(i)} y1={padding} x2={getX(i)} y2={height - padding} 
                                stroke="#94a3b8" strokeWidth="1" strokeDasharray="2" 
                                className="opacity-0 group-hover:opacity-50 transition-opacity" 
                            />

                            {/* Revenue Point */}
                            <circle cx={getX(i)} cy={getY(d.revenue)} r="5" fill="#fff" stroke="#3b82f6" strokeWidth="2" className="transition-all group-hover:r-6 shadow-sm dark:fill-slate-800" />
                            
                            {/* Profit Point */}
                            <circle cx={getX(i)} cy={getY(d.profit)} r="5" fill="#fff" stroke="#10b981" strokeWidth="2" className="transition-all group-hover:r-6 shadow-sm dark:fill-slate-800" />
                            
                            {/* X Axis Labels */}
                            <text x={getX(i)} y={height - padding + 20} textAnchor="middle" className="text-[11px] fill-slate-500 dark:fill-slate-400 font-medium uppercase tracking-wide">
                                {d.label}
                            </text>

                            {/* Tooltip */}
                            <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <rect 
                                    x={getX(i) - 60} 
                                    y={getY(d.revenue) - 70} 
                                    width="120" 
                                    height="60" 
                                    rx="6" 
                                    fill="#1e293b" 
                                    className="shadow-xl"
                                />
                                <text x={getX(i)} y={getY(d.revenue) - 52} textAnchor="middle" fill="#fff" className="text-[10px] font-bold uppercase">{d.label}</text>
                                <text x={getX(i)} y={getY(d.revenue) - 38} textAnchor="middle" fill="#60a5fa" className="text-[11px] font-bold">Rev: ${d.revenue.toLocaleString()}</text>
                                <text x={getX(i)} y={getY(d.revenue) - 24} textAnchor="middle" fill="#34d399" className="text-[11px] font-bold">Net: ${d.profit.toLocaleString()}</text>
                            </g>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
};
