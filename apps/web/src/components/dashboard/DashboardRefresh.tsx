import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, Pause, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

export interface RefreshStatus {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  error: string | null;
  success: boolean;
}

export interface DashboardRefreshProps {
  onRefresh: () => Promise<void>;
  refreshStatus: RefreshStatus;
  autoRefreshEnabled?: boolean;
  autoRefreshInterval?: number;
  onAutoRefreshChange?: (enabled: boolean) => void;
  onIntervalChange?: (interval: number) => void;
  className?: string;
}

const refreshIntervals = [
  { value: 30, label: '30 segundos' },
  { value: 60, label: '1 minuto' },
  { value: 300, label: '5 minutos' },
  { value: 600, label: '10 minutos' },
  { value: 1800, label: '30 minutos' },
];

export function DashboardRefresh({
  onRefresh,
  refreshStatus,
  autoRefreshEnabled = false,
  autoRefreshInterval = 300,
  onAutoRefreshChange,
  onIntervalChange,
  className,
}: DashboardRefreshProps) {
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Calculate time until next refresh
  useEffect(() => {
    if (!autoRefreshEnabled || !refreshStatus.nextRefresh) {
      setTimeUntilNext(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const next = refreshStatus.nextRefresh!;
      const remaining = Math.max(0, next.getTime() - now.getTime());
      const totalInterval = autoRefreshInterval * 1000;
      const elapsed = totalInterval - remaining;
      
      setTimeUntilNext(Math.ceil(remaining / 1000));
      setProgress((elapsed / totalInterval) * 100);

      if (remaining <= 0) {
        setTimeUntilNext(0);
        setProgress(100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshStatus.nextRefresh, autoRefreshInterval]);

  const handleManualRefresh = useCallback(async () => {
    if (refreshStatus.isRefreshing) return;
    await onRefresh();
  }, [onRefresh, refreshStatus.isRefreshing]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatLastRefresh = (date: Date | null): string => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = () => {
    if (refreshStatus.isRefreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (refreshStatus.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (refreshStatus.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (refreshStatus.isRefreshing) return 'Atualizando...';
    if (refreshStatus.error) return 'Erro na atualização';
    if (refreshStatus.success) return 'Atualizado com sucesso';
    return 'Pronto para atualizar';
  };

  const getStatusColor = () => {
    if (refreshStatus.isRefreshing) return 'bg-blue-100 text-blue-800';
    if (refreshStatus.error) return 'bg-red-100 text-red-800';
    if (refreshStatus.success) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getStatusIcon()}
            Atualização
          </CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Manual Refresh */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Atualização Manual</Label>
            <p className="text-xs text-muted-foreground">
              Última: {formatLastRefresh(refreshStatus.lastRefresh)}
            </p>
          </div>
          <Button
            onClick={handleManualRefresh}
            disabled={refreshStatus.isRefreshing}
            size="sm"
            variant="outline"
            className="h-8"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                refreshStatus.isRefreshing ? 'animate-spin' : ''
              }`}
            />
            Atualizar
          </Button>
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-refresh" className="text-sm font-medium">
              Atualização Automática
            </Label>
            <p className="text-xs text-muted-foreground">
              {autoRefreshEnabled ? 'Ativada' : 'Desativada'}
            </p>
          </div>
          <Switch
            id="auto-refresh"
            checked={autoRefreshEnabled}
            onCheckedChange={onAutoRefreshChange}
            disabled={refreshStatus.isRefreshing}
          />
        </div>

        {/* Auto Refresh Interval */}
        {autoRefreshEnabled && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Intervalo</Label>
            <Select
              value={autoRefreshInterval.toString()}
              onValueChange={(value) => onIntervalChange?.(parseInt(value))}
              disabled={refreshStatus.isRefreshing}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {refreshIntervals.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value.toString()}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Next Refresh Countdown */}
        {autoRefreshEnabled && timeUntilNext > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Próxima atualização</Label>
              <span className="text-xs text-muted-foreground">
                {formatTime(timeUntilNext)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Error Message */}
        {refreshStatus.error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600">{refreshStatus.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardRefresh;