import React from 'react';
import { Problem } from '@/types/document';
import { AlertTriangle } from 'lucide-react';

interface ProblemsListProps {
  problems: Problem[];
}

const ProblemsList: React.FC<ProblemsListProps> = ({ problems }) => {
  return (
    <div>
      <h4 className="font-semibold mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-500" />
        Problemas Encontrados
      </h4>
      <div className="space-y-2">
        {problems.map((problema, index) => (
          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                problema.gravidade === 'critica' ? 'bg-red-600 text-white' :
                problema.gravidade === 'alta' ? 'bg-red-500 text-white' :
                problema.gravidade === 'media' ? 'bg-orange-500 text-white' :
                'bg-yellow-500 text-white'
              }`}>
                {problema.gravidade}
              </span>
              <div>
                <p className="font-medium text-red-800">{problema.descricao}</p>
                {problema.localizacao && (
                  <p className="text-sm text-red-600">Local: {problema.localizacao}</p>
                )}
                {problema.sugestaoCorrecao && (
                  <p className="text-sm text-green-700 mt-1">💡 {problema.sugestaoCorrecao}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(ProblemsList);
