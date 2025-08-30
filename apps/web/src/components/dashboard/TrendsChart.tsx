import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrendsChartProps {
  data: any[];
  title: string;
  type: 'documents' | 'processing' | 'distribution' | 'scores';
  className?: string;
  isLoading?: boolean;
  height?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  type: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, type }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-gray-900 mb-3 border-b pb-2">
          {type === 'distribution' ? label : format(parseISO(label || ''), 'dd/MM/yyyy', { locale: ptBR })}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            let unit = '';
            if (type === 'processing' && entry.dataKey.includes('Time')) unit = 's';
            if (type === 'scores' && entry.dataKey.includes('score')) unit = '%';
            
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-700">{entry.name}:</span>
                </div>
                <span className="text-sm font-medium" style={{ color: entry.color }}>
                  {type === 'documents' && entry.dataKey === 'count' && `${entry.value} documentos`}
                  {type === 'documents' && entry.dataKey === 'score' && `${entry.value.toFixed(1)}%`}
                  {type === 'processing' && entry.dataKey === 'avgTime' && `${entry.value.toFixed(1)}s`}
                  {type === 'processing' && entry.dataKey === 'p95Time' && `${entry.value.toFixed(1)}s`}
                  {type === 'distribution' && `${entry.value} (${((entry.value / payload.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}%)`}
                  {type === 'scores' && `${entry.value.toFixed(1)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  quaternary: '#EF4444',
  pie: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
};

export const TrendsChart: React.FC<TrendsChartProps> = ({ 
  data, 
  title, 
  type, 
  className = '',
  isLoading = false,
  height = 300
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);

  const periodOptions = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '3m', label: '3 meses' },
    { value: '6m', label: '6 meses' },
    { value: '1y', label: '1 ano' },
    { value: 'all', label: 'Todos' }
  ];

  const handleZoomReset = () => {
    setIsZoomed(false);
    setZoomDomain(null);
  };

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      setZoomDomain([domain.startIndex, domain.endIndex]);
      setIsZoomed(true);
    }
  };
  const ChartSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className={`w-full h-[${height}px]`} />
    </div>
  );

  const renderChart = () => {
    const chartData = zoomDomain 
      ? data.slice(zoomDomain[0], zoomDomain[1] + 1)
      : data;

    switch (type) {
      case 'documents':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                yAxisId="count"
                orientation="left"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                yAxisId="score"
                orientation="right"
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                yAxisId="count"
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
                name="Documentos"
              />
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="score"
                stroke={COLORS.secondary}
                strokeWidth={2}
                name="Score Médio (%)"
                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
              />
              {!isZoomed && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke={COLORS.primary}
                  onChange={handleBrushChange}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'processing':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
                label={{ value: 'Tempo (s)', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke={COLORS.primary}
                strokeWidth={3}
                name="Tempo Médio"
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: COLORS.primary, strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="p95Time"
                stroke={COLORS.tertiary}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="P95"
                dot={{ fill: COLORS.tertiary, strokeWidth: 2, r: 4 }}
              />
              {!isZoomed && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke={COLORS.primary}
                  onChange={handleBrushChange}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'distribution':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip type={type} />} />
              </PieChart>
            </ResponsiveContainer>
            
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="range" 
                  stroke="#6b7280" 
                  fontSize={12}
                  width={60}
                />
                <Tooltip content={<CustomTooltip type={type} />} />
                <Bar dataKey="count" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scores':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                tick={{ fontSize: 11 }}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="score"
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
                fillOpacity={0.3}
                name="Score de Conformidade"
              />
              {!isZoomed && (
                <Brush
                  dataKey="date"
                  height={30}
                  stroke={COLORS.secondary}
                  onChange={handleBrushChange}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Tipo de gráfico não suportado
          </div>
        );
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'documents':
        return 'Volume de documentos processados e score médio de conformidade ao longo do tempo';
      case 'processing':
        return 'Tempo médio de processamento e percentil 95 das análises';
      case 'distribution':
        return 'Distribuição dos scores de conformidade por faixas';
      case 'scores':
        return 'Evolução do score de conformidade ao longo do tempo';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <ChartSkeleton />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <span>{title}</span>
              {isZoomed && (
                <Badge variant="secondary" className="text-xs">
                  Zoom Ativo
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32 h-8">
                <Calendar className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {isZoomed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
                className="h-8 px-2"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden">
          {data.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p>Nenhum dado disponível</p>
              </div>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendsChart;