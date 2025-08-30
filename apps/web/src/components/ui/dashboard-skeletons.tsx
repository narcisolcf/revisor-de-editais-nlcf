import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AnimatedContainer } from '@/components/ui/animated-container';

// Skeleton para cards de métricas
export function MetricCardSkeleton() {
  return (
    <AnimatedContainer animation="fadeIn">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

// Skeleton para gráficos
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <AnimatedContainer animation="fadeIn">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controles do gráfico */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
            
            {/* Área do gráfico */}
            <div className="relative" style={{ height }}>
              <Skeleton className="absolute inset-0 rounded-lg" />
              
              {/* Linhas de grade simuladas */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-px w-full" />
                ))}
              </div>
              
              {/* Barras/pontos simulados */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton 
                    key={i} 
                    className="w-8" 
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

// Skeleton para tabela de documentos
export function DocumentsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <AnimatedContainer animation="fadeIn">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center space-x-4 mt-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-6 gap-4 pb-2 border-b">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            {/* Linhas da tabela */}
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            ))}
            
            {/* Paginação */}
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

// Skeleton para breakdown de problemas
export function IssuesBreakdownSkeleton() {
  return (
    <AnimatedContainer animation="fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-12" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AnimatedContainer>
  );
}

// Skeleton para métricas de performance
export function PerformanceMetricsSkeleton() {
  return (
    <AnimatedContainer animation="fadeIn">
      <div className="space-y-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-3 w-3 rounded" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AnimatedContainer>
  );
}

// Skeleton para ações rápidas
export function QuickActionsSkeleton() {
  return (
    <AnimatedContainer animation="fadeIn">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    </AnimatedContainer>
  );
}

export default {
  MetricCardSkeleton,
  ChartSkeleton,
  DocumentsTableSkeleton,
  IssuesBreakdownSkeleton,
  PerformanceMetricsSkeleton,
  QuickActionsSkeleton,
};