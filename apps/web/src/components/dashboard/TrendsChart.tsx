import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrendsChartProps {
  data: any[];
  title: string;
  type: 'documents' | 'processing' | 'distribution' | 'scores';
  className?: string;
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
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">
          {type === 'distribution' ? label : format(parseISO(label || ''), 'dd/MM/yyyy', { locale: ptBR })}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>
            <span className="ml-1">
              {type === 'documents' && entry.dataKey === 'count' && `${entry.value} documentos`}
              {type === 'documents' && entry.dataKey === 'score' && `${entry.value.toFixed(1)}%`}
              {type === 'processing' && entry.dataKey === 'avgTime' && `${entry.value.toFixed(1)}s`}
              {type === 'processing' && entry.dataKey === 'p95Time' && `${entry.value.toFixed(1)}s`}
              {type === 'distribution' && `${entry.value} (${((entry.value / payload.reduce((sum, p) => sum + p.value, 0)) * 100).toFixed(1)}%)`}
              {type === 'scores' && `${entry.value.toFixed(1)}%`}
            </span>
          </p>
        ))}
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
  className = '' 
}) => {
  const renderChart = () => {
    switch (type) {
      case 'documents':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                yAxisId="count"
                orientation="left"
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                yAxisId="score"
                orientation="right"
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend />
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
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'processing':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'Tempo (s)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Tempo Médio"
                dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
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
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                stroke="#6b7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6b7280"
                fontSize={12}
                label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="score"
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
                fillOpacity={0.3}
                name="Score de Conformidade"
              />
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

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{getDescription()}</p>
          </div>
          <div className="text-sm text-gray-500">
            {data.length} {type === 'distribution' ? 'faixas' : 'pontos'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default TrendsChart;