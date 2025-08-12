"""
Demo do Sistema de Observabilidade

Demonstração completa das funcionalidades de monitoramento.
"""

import asyncio
import random
from datetime import datetime, timedelta

from .observability import get_observability_manager, observe_async, observe_sync
from .metrics import get_metrics_collector
from .tracing import get_tracer
from .alerting import AlertRule, AlertSeverity


async def demo_observability():
    """Demonstra todas as funcionalidades de observabilidade."""
    print("🔍 Iniciando demonstração do sistema de observabilidade...")
    
    # Obtém gerenciador de observabilidade
    manager = await get_observability_manager("demo-service")
    
    # Simula diferentes tipos de operações
    await demo_analysis_operations(manager)
    await demo_error_scenarios(manager)
    await demo_performance_monitoring(manager)
    
    # Exibe dashboard final
    await show_dashboard(manager)
    
    print("\n✅ Demonstração concluída!")


async def demo_analysis_operations(manager):
    """Demonstra operações de análise com observabilidade."""
    print("\n📊 Simulando operações de análise...")
    
    for i in range(10):
        # Simula análise de documento
        async with manager.observe_operation(
            "document_analysis",
            tags={"document_type": "edital", "organization": f"org_{i % 3}"}
        ) as span:
            # Simula tempo de processamento variável
            processing_time = random.uniform(0.5, 3.0)
            await asyncio.sleep(processing_time)
            
            if span:
                span.add_event("text_extraction_completed")
                span.add_tag("processing_time_category", 
                           "fast" if processing_time < 1.0 else "normal" if processing_time < 2.0 else "slow")
            
            # Simula sub-operações
            await simulate_sub_operations(manager)
            
            # Registra métricas de negócio
            analysis_score = random.uniform(60, 95)
            findings_count = random.randint(0, 15)
            
            manager.record_business_metric("analysis_score", analysis_score)
            manager.record_business_metric("findings_count", findings_count)
        
        print(f"  ✓ Análise {i+1}/10 concluída")


async def simulate_sub_operations(manager):
    """Simula sub-operações dentro da análise."""
    operations = [
        ("text_extraction", 0.3),
        ("structural_analysis", 0.8),
        ("legal_validation", 0.5),
        ("scoring_calculation", 0.2)
    ]
    
    for op_name, duration in operations:
        async with manager.observe_operation(op_name) as span:
            await asyncio.sleep(duration)
            if span:
                span.add_tag("operation_category", "analysis_step")


async def demo_error_scenarios(manager):
    """Demonstra cenários de erro para testar alertas."""
    print("\n⚠️ Simulando cenários de erro...")
    
    # Simula erros ocasionais
    for i in range(5):
        try:
            async with manager.observe_operation(
                "error_prone_operation",
                tags={"attempt": i+1}
            ) as span:
                await asyncio.sleep(0.2)
                
                # 40% de chance de erro
                if random.random() < 0.4:
                    error_types = ["ValidationError", "TimeoutError", "ProcessingError"]
                    error_type = random.choice(error_types)
                    raise Exception(f"Simulated {error_type}")
                
                if span:
                    span.add_tag("result", "success")
        
        except Exception as e:
            print(f"  ❌ Erro simulado: {e}")
            # Erro é automaticamente registrado pelo context manager
        
        await asyncio.sleep(0.1)


async def demo_performance_monitoring(manager):
    """Demonstra monitoramento de performance."""
    print("\n🚀 Simulando operações de performance...")
    
    # Simula operações com diferentes perfis de performance
    operations = [
        ("fast_operation", 0.1, 0.05),  # operação rápida
        ("medium_operation", 0.5, 0.2),  # operação média
        ("slow_operation", 2.0, 0.5),   # operação lenta
    ]
    
    for op_name, base_time, variance in operations:
        for i in range(3):
            processing_time = base_time + random.uniform(-variance, variance)
            
            async with manager.observe_operation(op_name, tags={"iteration": i+1}) as span:
                await asyncio.sleep(processing_time)
                
                if span:
                    span.add_tag("performance_category", 
                               "fast" if processing_time < 0.3 else 
                               "medium" if processing_time < 1.0 else "slow")
        
        print(f"  ⏱️ {op_name}: 3 execuções concluídas")


async def show_dashboard(manager):
    """Exibe dashboard com dados de monitoramento."""
    print("\n📋 Dashboard de Monitoramento:")
    print("=" * 50)
    
    # Status de saúde
    health = await manager.get_health_status()
    print(f"Status do Sistema: {health['status'].upper()}")
    print(f"Timestamp: {health['timestamp']}")
    
    for component, status in health.get('components', {}).items():
        status_emoji = "✅" if status['status'] == 'healthy' else "⚠️" if status['status'] == 'degraded' else "❌"
        print(f"  {status_emoji} {component}: {status['status']}")
    
    print()
    
    # Dashboard completo
    dashboard = await manager.get_monitoring_dashboard()
    
    # Métricas principais
    if 'metrics' in dashboard and 'key_metrics' in dashboard['metrics']:
        print("📊 Métricas Principais:")
        for metric_name, data in dashboard['metrics']['key_metrics'].items():
            latest = data.get('latest_value', 'N/A')
            unit = data.get('unit', '')
            print(f"  • {metric_name}: {latest} {unit}")
        print()
    
    # Traces
    if 'traces' in dashboard:
        trace_data = dashboard['traces']
        if not isinstance(trace_data, dict) or 'error' not in trace_data:
            print(f"🔍 Traces Ativos: {trace_data.get('active_count', 0)}")
            
            recent_ops = trace_data.get('recent_operations', [])
            if recent_ops:
                print("  Operações Recentes:")
                for op in recent_ops[-5:]:  # Últimas 5
                    status_emoji = "✅" if op['status'] == 'ok' else "❌"
                    duration = op.get('duration_ms', 0)
                    print(f"    {status_emoji} {op['operation']}: {duration:.1f}ms")
            print()
    
    # Alertas
    if 'alerts' in dashboard:
        alert_data = dashboard['alerts']
        if not isinstance(alert_data, dict) or 'error' not in alert_data:
            active_alerts = alert_data.get('active_alerts', 0)
            print(f"🚨 Alertas Ativos: {active_alerts}")
            
            alerts_24h = alert_data.get('alerts_last_24h', 0)
            print(f"📈 Alertas (24h): {alerts_24h}")
            
            severity_dist = alert_data.get('alerts_by_severity_24h', {})
            if severity_dist:
                print("  Por Severidade:")
                for severity, count in severity_dist.items():
                    if count > 0:
                        emoji = {"info": "ℹ️", "warning": "⚠️", "error": "❌", "critical": "🚨"}.get(severity, "📢")
                        print(f"    {emoji} {severity}: {count}")
    
    print("=" * 50)


@observe_async("example_business_operation")
async def example_instrumented_function(document_id: str, complexity: str = "medium"):
    """Exemplo de função instrumentada automaticamente."""
    processing_time = {"low": 0.5, "medium": 1.0, "high": 2.0}.get(complexity, 1.0)
    await asyncio.sleep(processing_time)
    
    # Simula processamento
    if random.random() < 0.1:  # 10% chance de erro
        raise ValueError("Processamento falhou")
    
    return {"document_id": document_id, "score": random.uniform(70, 95)}


@observe_sync("example_sync_operation")
def example_sync_function(data: str):
    """Exemplo de função síncrona instrumentada."""
    import time
    time.sleep(0.1)  # Simula processamento
    return f"Processed: {data}"


async def demo_instrumented_functions():
    """Demonstra funções instrumentadas automaticamente."""
    print("\n🔧 Testando instrumentação automática...")
    
    # Testa função async instrumentada
    for i in range(3):
        try:
            result = await example_instrumented_function(
                f"doc_{i}",
                complexity=random.choice(["low", "medium", "high"])
            )
            print(f"  ✓ Função async: {result}")
        except Exception as e:
            print(f"  ❌ Erro na função async: {e}")
    
    # Testa função sync instrumentada
    for i in range(3):
        result = example_sync_function(f"data_{i}")
        print(f"  ✓ Função sync: {result}")


async def demo_custom_alerts():
    """Demonstra criação de alertas customizados."""
    print("\n🔔 Configurando alertas customizados...")
    
    manager = await get_observability_manager()
    
    if manager.alert_manager:
        # Adiciona regra customizada
        custom_rule = AlertRule(
            id="demo_high_score",
            name="Score Alto Detectado",
            description="Score de análise muito alto (possivelmente suspeito)",
            metric_name="analysis_score",
            condition="greater_than",
            threshold=90.0,
            severity=AlertSeverity.INFO,
            evaluation_window_minutes=1,
            cooldown_minutes=2
        )
        
        manager.alert_manager.add_rule(custom_rule)
        print("  ✓ Regra de alerta customizada adicionada")
        
        # Simula valores que dispararão o alerta
        for i in range(3):
            high_score = random.uniform(91, 98)
            manager.record_business_metric("analysis_score", high_score)
            print(f"  📊 Score registrado: {high_score:.1f}")
            await asyncio.sleep(0.5)
        
        # Aguarda processamento dos alertas
        await asyncio.sleep(2)


async def run_complete_demo():
    """Executa demonstração completa do sistema."""
    try:
        print("🎯 Sistema de Observabilidade - Demonstração Completa")
        print("=" * 60)
        
        # Demo principal
        await demo_observability()
        
        # Demo de instrumentação
        await demo_instrumented_functions()
        
        # Demo de alertas
        await demo_custom_alerts()
        
        print("\n🎉 Demonstração completa finalizada com sucesso!")
        
    except Exception as e:
        print(f"\n💥 Erro durante demonstração: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(run_complete_demo())