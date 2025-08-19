"""
Advanced Alerting System

Sistema avançado de alertas com múltiplos canais e regras configuráveis.
"""

import asyncio
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod

from .metrics import MetricsCollector, Metric


class AlertSeverity(str, Enum):
    """Severidade do alerta."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    """Status do alerta."""
    TRIGGERED = "triggered"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"


@dataclass
class AlertRule:
    """Regra de alerta."""
    id: str
    name: str
    description: str
    metric_name: str
    condition: str  # "greater_than", "less_than", "equals", "not_equals"
    threshold: float
    severity: AlertSeverity
    evaluation_window_minutes: int = 5
    cooldown_minutes: int = 30
    enabled: bool = True
    tags: Dict[str, str] = field(default_factory=dict)
    
    def evaluate(self, metric: Metric) -> bool:
        """Avalia se a regra deve disparar."""
        if not self.enabled:
            return False
        
        latest_value = metric.get_latest_value()
        if latest_value is None:
            return False
        
        if self.condition == "greater_than":
            return latest_value > self.threshold
        elif self.condition == "less_than":
            return latest_value < self.threshold
        elif self.condition == "equals":
            return latest_value == self.threshold
        elif self.condition == "not_equals":
            return latest_value != self.threshold
        
        return False


@dataclass
class Alert:
    """Alerta disparado."""
    id: str
    rule_id: str
    rule_name: str
    metric_name: str
    current_value: float
    threshold: float
    severity: AlertSeverity
    status: AlertStatus
    triggered_at: datetime
    message: str
    context: Dict[str, Any] = field(default_factory=dict)
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    suppressed_until: Optional[datetime] = None
    
    def acknowledge(self, user_id: str) -> None:
        """Reconhece o alerta."""
        self.status = AlertStatus.ACKNOWLEDGED
        self.acknowledged_at = datetime.utcnow()
        self.acknowledged_by = user_id
    
    def resolve(self) -> None:
        """Resolve o alerta."""
        self.status = AlertStatus.RESOLVED
        self.resolved_at = datetime.utcnow()
    
    def suppress(self, duration_minutes: int) -> None:
        """Suprime o alerta temporariamente."""
        self.status = AlertStatus.SUPPRESSED
        self.suppressed_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
    
    def is_suppressed(self) -> bool:
        """Verifica se o alerta está suprimido."""
        if self.status != AlertStatus.SUPPRESSED:
            return False
        
        if self.suppressed_until and datetime.utcnow() > self.suppressed_until:
            self.status = AlertStatus.TRIGGERED
            self.suppressed_until = None
            return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'id': self.id,
            'rule_id': self.rule_id,
            'rule_name': self.rule_name,
            'metric_name': self.metric_name,
            'current_value': self.current_value,
            'threshold': self.threshold,
            'severity': self.severity.value,
            'status': self.status.value,
            'triggered_at': self.triggered_at.isoformat(),
            'message': self.message,
            'context': self.context,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            'acknowledged_by': self.acknowledged_by,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'suppressed_until': self.suppressed_until.isoformat() if self.suppressed_until else None
        }


class AlertChannel(ABC):
    """Interface para canais de alerta."""
    
    @abstractmethod
    async def send_alert(self, alert: Alert) -> bool:
        """Envia alerta através do canal."""
        pass
    
    @abstractmethod
    def supports_severity(self, severity: AlertSeverity) -> bool:
        """Verifica se o canal suporta a severidade."""
        pass


class ConsoleAlertChannel(AlertChannel):
    """Canal de alerta para console."""
    
    def __init__(self, min_severity: AlertSeverity = AlertSeverity.INFO):
        self.min_severity = min_severity
        self._severity_order = {
            AlertSeverity.INFO: 0,
            AlertSeverity.WARNING: 1,
            AlertSeverity.ERROR: 2,
            AlertSeverity.CRITICAL: 3
        }
    
    async def send_alert(self, alert: Alert) -> bool:
        """Envia alerta para console."""
        try:
            emoji = {
                AlertSeverity.INFO: "ℹ️",
                AlertSeverity.WARNING: "⚠️",
                AlertSeverity.ERROR: "❌",
                AlertSeverity.CRITICAL: "🚨"
            }.get(alert.severity, "📢")
            
            print(f"\n{emoji} ALERT [{alert.severity.value.upper()}] {alert.rule_name}")
            print(f"   Metric: {alert.metric_name}")
            print(f"   Current: {alert.current_value}, Threshold: {alert.threshold}")
            print(f"   Message: {alert.message}")
            print(f"   Time: {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S')}")
            
            if alert.context:
                print(f"   Context: {json.dumps(alert.context, indent=2)}")
            
            return True
        except Exception as e:
            print(f"Erro ao enviar alerta para console: {e}")
            return False
    
    def supports_severity(self, severity: AlertSeverity) -> bool:
        """Verifica se suporta a severidade."""
        return self._severity_order[severity] >= self._severity_order[self.min_severity]


class EmailAlertChannel(AlertChannel):
    """Canal de alerta para email."""
    
    def __init__(
        self,
        smtp_server: str,
        smtp_port: int,
        username: str,
        password: str,
        from_email: str,
        to_emails: List[str],
        min_severity: AlertSeverity = AlertSeverity.WARNING
    ):
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.to_emails = to_emails
        self.min_severity = min_severity
        self._severity_order = {
            AlertSeverity.INFO: 0,
            AlertSeverity.WARNING: 1,
            AlertSeverity.ERROR: 2,
            AlertSeverity.CRITICAL: 3
        }
    
    async def send_alert(self, alert: Alert) -> bool:
        """Envia alerta por email."""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Cria mensagem
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(self.to_emails)
            msg['Subject'] = f"[{alert.severity.value.upper()}] {alert.rule_name}"
            
            # Corpo do email
            body = f"""
Alerta disparado no sistema de análise.

Regra: {alert.rule_name}
Métrica: {alert.metric_name}
Valor atual: {alert.current_value}
Limite: {alert.threshold}
Severidade: {alert.severity.value}
Horário: {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S')}

Mensagem: {alert.message}

Contexto:
{json.dumps(alert.context, indent=2)}

---
Sistema de Monitoramento LicitaReview
            """.strip()
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Envia email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)
            
            text = msg.as_string()
            server.sendmail(self.from_email, self.to_emails, text)
            server.quit()
            
            return True
        except Exception as e:
            print(f"Erro ao enviar alerta por email: {e}")
            return False
    
    def supports_severity(self, severity: AlertSeverity) -> bool:
        """Verifica se suporta a severidade."""
        return self._severity_order[severity] >= self._severity_order[self.min_severity]


class SlackAlertChannel(AlertChannel):
    """Canal de alerta para Slack."""
    
    def __init__(
        self,
        webhook_url: str,
        channel: str = "#alerts",
        min_severity: AlertSeverity = AlertSeverity.WARNING
    ):
        self.webhook_url = webhook_url
        self.channel = channel
        self.min_severity = min_severity
        self._severity_order = {
            AlertSeverity.INFO: 0,
            AlertSeverity.WARNING: 1,
            AlertSeverity.ERROR: 2,
            AlertSeverity.CRITICAL: 3
        }
    
    async def send_alert(self, alert: Alert) -> bool:
        """Envia alerta para Slack."""
        try:
            import aiohttp
            
            # Cores por severidade
            colors = {
                AlertSeverity.INFO: "#36a64f",
                AlertSeverity.WARNING: "#ff9500",
                AlertSeverity.ERROR: "#ff0000",
                AlertSeverity.CRITICAL: "#8b0000"
            }
            
            # Payload do Slack
            payload = {
                "channel": self.channel,
                "username": "LicitaReview Monitor",
                "icon_emoji": ":warning:",
                "attachments": [{
                    "color": colors.get(alert.severity, "#cccccc"),
                    "title": f"[{alert.severity.value.upper()}] {alert.rule_name}",
                    "text": alert.message,
                    "fields": [
                        {
                            "title": "Métrica",
                            "value": alert.metric_name,
                            "short": True
                        },
                        {
                            "title": "Valor Atual",
                            "value": str(alert.current_value),
                            "short": True
                        },
                        {
                            "title": "Limite",
                            "value": str(alert.threshold),
                            "short": True
                        },
                        {
                            "title": "Horário",
                            "value": alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S'),
                            "short": True
                        }
                    ],
                    "ts": alert.triggered_at.timestamp()
                }]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    return response.status == 200
                    
        except Exception as e:
            print(f"Erro ao enviar alerta para Slack: {e}")
            return False
    
    def supports_severity(self, severity: AlertSeverity) -> bool:
        """Verifica se suporta a severidade."""
        return self._severity_order[severity] >= self._severity_order[self.min_severity]


class AlertManager:
    """
    Gerenciador de alertas para o sistema.
    
    Monitora métricas, avalia regras e dispara alertas
    através de múltiplos canais.
    """
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics_collector = metrics_collector
        self.rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.channels: List[AlertChannel] = []
        self._last_evaluation: Dict[str, datetime] = {}
        self._cooldown_tracker: Dict[str, datetime] = {}
        self._background_task: Optional[asyncio.Task] = None
        self._is_running = False
        
        # Registra regras padrão
        self._register_default_rules()
    
    def _register_default_rules(self) -> None:
        """Registra regras de alerta padrão."""
        default_rules = [
            AlertRule(
                id="high_cpu_usage",
                name="Alto uso de CPU",
                description="CPU acima de 80%",
                metric_name="cpu_usage_percentage",
                condition="greater_than",
                threshold=80.0,
                severity=AlertSeverity.WARNING,
                evaluation_window_minutes=5,
                cooldown_minutes=15
            ),
            AlertRule(
                id="critical_cpu_usage",
                name="Uso crítico de CPU",
                description="CPU acima de 95%",
                metric_name="cpu_usage_percentage",
                condition="greater_than",
                threshold=95.0,
                severity=AlertSeverity.CRITICAL,
                evaluation_window_minutes=2,
                cooldown_minutes=10
            ),
            AlertRule(
                id="high_memory_usage",
                name="Alto uso de memória",
                description="Memória acima de 1GB",
                metric_name="memory_usage_bytes",
                condition="greater_than",
                threshold=1024 * 1024 * 1024,  # 1GB
                severity=AlertSeverity.WARNING,
                evaluation_window_minutes=5,
                cooldown_minutes=15
            ),
            AlertRule(
                id="high_error_rate",
                name="Alta taxa de erro",
                description="Mais de 10 erros por minuto",
                metric_name="analysis_errors_total",
                condition="greater_than",
                threshold=10.0,
                severity=AlertSeverity.ERROR,
                evaluation_window_minutes=1,
                cooldown_minutes=5
            ),
            AlertRule(
                id="analysis_timeout",
                name="Timeout em análises",
                description="Análises demorando mais que 60 segundos",
                metric_name="analysis_duration_seconds",
                condition="greater_than",
                threshold=60.0,
                severity=AlertSeverity.WARNING,
                evaluation_window_minutes=3,
                cooldown_minutes=10
            )
        ]
        
        for rule in default_rules:
            self.add_rule(rule)
    
    def add_rule(self, rule: AlertRule) -> None:
        """Adiciona regra de alerta."""
        self.rules[rule.id] = rule
    
    def remove_rule(self, rule_id: str) -> None:
        """Remove regra de alerta."""
        if rule_id in self.rules:
            del self.rules[rule_id]
    
    def add_channel(self, channel: AlertChannel) -> None:
        """Adiciona canal de alerta."""
        self.channels.append(channel)
    
    def get_active_alerts(self) -> List[Alert]:
        """Obtém alertas ativos."""
        return [alert for alert in self.active_alerts.values() 
                if alert.status == AlertStatus.TRIGGERED and not alert.is_suppressed()]
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Obtém histórico de alertas."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return [alert for alert in self.alert_history if alert.triggered_at >= cutoff]
    
    async def start_monitoring(self) -> None:
        """Inicia monitoramento de alertas."""
        if self._is_running:
            return
        
        self._is_running = True
        self._background_task = asyncio.create_task(self._monitoring_loop())
    
    async def stop_monitoring(self) -> None:
        """Para monitoramento de alertas."""
        self._is_running = False
        if self._background_task:
            self._background_task.cancel()
            try:
                await self._background_task
            except asyncio.CancelledError:
                pass
    
    async def _monitoring_loop(self) -> None:
        """Loop principal de monitoramento."""
        while self._is_running:
            try:
                await self._evaluate_rules()
                await asyncio.sleep(30)  # Avalia a cada 30 segundos
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Erro no loop de monitoramento de alertas: {e}")
                await asyncio.sleep(5)
    
    async def _evaluate_rules(self) -> None:
        """Avalia todas as regras de alerta."""
        now = datetime.utcnow()
        
        for rule in self.rules.values():
            if not rule.enabled:
                continue
            
            # Verifica cooldown
            if self._is_in_cooldown(rule.id, now):
                continue
            
            # Obtém métrica
            metric = self.metrics_collector.get_metric(rule.metric_name)
            if not metric:
                continue
            
            # Avalia regra
            if rule.evaluate(metric):
                await self._trigger_alert(rule, metric)
    
    def _is_in_cooldown(self, rule_id: str, now: datetime) -> bool:
        """Verifica se a regra está em cooldown."""
        if rule_id not in self._cooldown_tracker:
            return False
        
        rule = self.rules[rule_id]
        last_trigger = self._cooldown_tracker[rule_id]
        cooldown_until = last_trigger + timedelta(minutes=rule.cooldown_minutes)
        
        return now < cooldown_until
    
    async def _trigger_alert(self, rule: AlertRule, metric: Metric) -> None:
        """Dispara um alerta."""
        import uuid
        
        current_value = metric.get_latest_value()
        if current_value is None:
            return
        
        # Cria alerta
        alert = Alert(
            id=str(uuid.uuid4()),
            rule_id=rule.id,
            rule_name=rule.name,
            metric_name=rule.metric_name,
            current_value=current_value,
            threshold=rule.threshold,
            severity=rule.severity,
            status=AlertStatus.TRIGGERED,
            triggered_at=datetime.utcnow(),
            message=f"{rule.description}. Valor atual: {current_value}, Limite: {rule.threshold}",
            context={
                "metric_unit": metric.unit.value,
                "evaluation_window": rule.evaluation_window_minutes,
                "tags": rule.tags
            }
        )
        
        # Adiciona à lista ativa
        self.active_alerts[alert.id] = alert
        self.alert_history.append(alert)
        
        # Atualiza cooldown
        self._cooldown_tracker[rule.id] = datetime.utcnow()
        
        # Envia através dos canais
        await self._send_alert(alert)
    
    async def _send_alert(self, alert: Alert) -> None:
        """Envia alerta através dos canais."""
        tasks = []
        
        for channel in self.channels:
            if channel.supports_severity(alert.severity):
                tasks.append(channel.send_alert(alert))
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            success_count = sum(1 for result in results if result is True)
            
            if success_count == 0:
                print(f"Falha ao enviar alerta {alert.id} através de todos os canais")
    
    async def acknowledge_alert(self, alert_id: str, user_id: str) -> bool:
        """Reconhece um alerta."""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].acknowledge(user_id)
            return True
        return False
    
    async def resolve_alert(self, alert_id: str) -> bool:
        """Resolve um alerta."""
        if alert_id in self.active_alerts:
            alert = self.active_alerts[alert_id]
            alert.resolve()
            del self.active_alerts[alert_id]
            return True
        return False
    
    async def suppress_alert(self, alert_id: str, duration_minutes: int) -> bool:
        """Suprime um alerta."""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id].suppress(duration_minutes)
            return True
        return False
    
    def get_alert_statistics(self) -> Dict[str, Any]:
        """Obtém estatísticas de alertas."""
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        recent_alerts = [a for a in self.alert_history if a.triggered_at >= last_24h]
        weekly_alerts = [a for a in self.alert_history if a.triggered_at >= last_7d]
        
        return {
            "active_alerts": len(self.get_active_alerts()),
            "total_rules": len(self.rules),
            "enabled_rules": len([r for r in self.rules.values() if r.enabled]),
            "channels_configured": len(self.channels),
            "alerts_last_24h": len(recent_alerts),
            "alerts_last_7d": len(weekly_alerts),
            "alerts_by_severity_24h": {
                severity.value: len([a for a in recent_alerts if a.severity == severity])
                for severity in AlertSeverity
            },
            "top_triggered_rules_24h": self._get_top_rules(recent_alerts, 5)
        }
    
    def _get_top_rules(self, alerts: List[Alert], limit: int) -> List[Dict[str, Any]]:
        """Obtém regras mais disparadas."""
        rule_counts = {}
        for alert in alerts:
            rule_counts[alert.rule_id] = rule_counts.get(alert.rule_id, 0) + 1
        
        sorted_rules = sorted(rule_counts.items(), key=lambda x: x[1], reverse=True)
        
        return [{
            "rule_id": rule_id,
            "rule_name": self.rules.get(rule_id, {}).name if rule_id in self.rules else "Unknown",
            "count": count
        } for rule_id, count in sorted_rules[:limit]]


# Função para criar alertas padrão
def setup_default_alerting(metrics_collector: MetricsCollector) -> AlertManager:
    """Configura sistema de alertas padrão."""
    manager = AlertManager(metrics_collector)
    
    # Adiciona canal de console
    console_channel = ConsoleAlertChannel(min_severity=AlertSeverity.WARNING)
    manager.add_channel(console_channel)
    
    return manager