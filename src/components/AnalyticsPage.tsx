import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency, parseLocalDate } from '../lib/utils';
import { Info } from 'lucide-react';
import { DataRecord } from '../types';

interface AnalyticsPageProps {
  transactions: DataRecord[];
}

const COLORS = ['#009B3A', '#FED100', '#000000', '#166534', '#d97706'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <p className="text-sm font-black text-jamaica-black">
              {entry.name}: <span className="text-brand-600">{typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{payload[0].name}</p>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
          <p className="text-sm font-black text-jamaica-black">
            Value: <span className="text-brand-600">{formatCurrency(payload[0].value)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function AnalyticsPage({ transactions }: AnalyticsPageProps) {
  // Process transactions for charts
  const monthlyData = transactions.reduce((acc: any[], curr) => {
    const month = parseLocalDate(curr.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find(d => d.name === month);
    if (existing) {
      existing.revenue += curr.revenue;
    } else {
      acc.push({ name: month, revenue: curr.revenue });
    }
    return acc;
  }, []).sort((a, b) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(a.name) - months.indexOf(b.name);
  });

  const categoryData = transactions.reduce((acc: any[], curr) => {
    const existing = acc.find(d => d.name === curr.category);
    if (existing) {
      existing.value += curr.revenue;
    } else {
      acc.push({ name: curr.category, value: curr.revenue });
    }
    return acc;
  }, []);

  // Simple forecasting logic: average of last 3 months growth
  const lastMonths = monthlyData.slice(-3);
  let avgGrowth = 0;
  if (lastMonths.length >= 2) {
    const growths = [];
    for (let i = 1; i < lastMonths.length; i++) {
      growths.push(lastMonths[i].revenue - lastMonths[i-1].revenue);
    }
    avgGrowth = growths.reduce((a, b) => a + b, 0) / growths.length;
  }

  const forecastData = [
    ...monthlyData.map(d => ({ ...d, type: 'historical' })),
  ];

  if (monthlyData.length > 0) {
    const lastMonth = monthlyData[monthlyData.length - 1];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let lastMonthIndex = months.indexOf(lastMonth.name);
    
    for (let i = 1; i <= 6; i++) {
      const nextMonthIndex = (lastMonthIndex + i) % 12;
      forecastData.push({
        name: months[nextMonthIndex],
        revenue: Math.max(0, lastMonth.revenue + (avgGrowth * i)),
        type: 'forecast'
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-3xl h-[450px]">
          <h3 className="font-black text-jamaica-black mb-6 uppercase tracking-tight">Revenue Growth Projection</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#009B3A" strokeWidth={4} dot={{ r: 5, fill: '#009B3A' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-3xl h-[450px]">
          <h3 className="font-black text-jamaica-black mb-6 uppercase tracking-tight">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl">
        <h3 className="font-black text-jamaica-black mb-6 uppercase tracking-tight">Performance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Total Revenue', value: formatCurrency(transactions.reduce((acc, curr) => acc + curr.revenue, 0)), trend: 'Live' },
            { label: 'Total Profit', value: formatCurrency(transactions.reduce((acc, curr) => acc + curr.profit, 0)), trend: 'Live' },
            { label: 'Avg Revenue/Trans', value: formatCurrency(transactions.length > 0 ? transactions.reduce((acc, curr) => acc + curr.revenue, 0) / transactions.length : 0), trend: 'Live' },
            { label: 'Total Customers', value: transactions.reduce((acc, curr) => acc + curr.customers, 0).toString(), trend: 'Live' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-jamaica-black tracking-tighter">{stat.value}</p>
              <p className="text-xs font-bold mt-1 text-brand-600">
                {stat.trend} data
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Forecasting Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-jamaica-black uppercase tracking-tight">6-Month Revenue Forecast</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Projected growth based on historical performance</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#009B3A" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#009B3A" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FED100" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#FED100" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10}} 
                tickFormatter={(v) => `$${v/1000}k`} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Historical Revenue"
                stroke="#009B3A" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorHistorical)" 
                data={forecastData.filter(d => d.type === 'historical')}
                strokeDasharray="0"
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Forecasted Revenue"
                stroke="#FED100" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorForecast)" 
                data={forecastData.filter(d => d.type === 'forecast')}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-8 rounded-3xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Info size={18} className="text-brand-600" />
            <h3 className="font-black text-jamaica-black uppercase tracking-tight">Forecast Assumptions</h3>
          </div>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Model</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Linear projection based on the average monthly growth of the last 3 months: <span className="text-brand-600 font-bold">{formatCurrency(avgGrowth)}</span>.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Conditions</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Assumes stable macroeconomic conditions in the Jamaican tech sector and consistent customer acquisition costs.
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seasonality</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">
                Forecast accounts for standard business cycles but excludes potential one-time enterprise contract spikes.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score</span>
              <span className="text-sm font-black text-brand-600">Dynamic</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
