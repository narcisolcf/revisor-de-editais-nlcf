import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid, BarChart, XAxis, YAxis, Bar } from 'recharts';
import { mockAnalysisResults } from '@/data/mockAnalysis';

const AnalysisCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Conformidade Chart */}
      <div>
        <h4 className="font-semibold mb-2">Distribuição de Conformidade</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={mockAnalysisResults.conformidade}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={false}
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {mockAnalysisResults.conformidade.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Problems Chart */}
      <div>
        <h4 className="font-semibold mb-2">Problemas por Categoria</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockAnalysisResults.problemas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#8884d8" isAnimationActive={false}>
                {mockAnalysisResults.problemas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AnalysisCharts);
