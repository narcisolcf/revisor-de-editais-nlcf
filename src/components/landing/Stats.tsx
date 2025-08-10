import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-lg p-6 bg-[#e7ebf3]">
      <p className="text-[#0e121b] text-base font-medium leading-normal">{title}</p>
      <p className="text-[#0e121b] tracking-light text-2xl font-bold leading-tight">{value}</p>
    </div>
  );
};

interface StatsProps {
  documentsReviewed?: string;
  agenciesServed?: string;
}

const Stats: React.FC<StatsProps> = ({ 
  documentsReviewed = "1,500+", 
  agenciesServed = "50+" 
}) => {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      <StatCard title="Documentos Revisados" value={documentsReviewed} />
      <StatCard title="Órgãos Atendidos" value={agenciesServed} />
    </div>
  );
};

export default Stats;