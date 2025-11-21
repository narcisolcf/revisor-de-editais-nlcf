import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search, CheckCircle, BarChart3, Shield, Zap } from 'lucide-react';

const services = [
  {
    icon: FileText,
    title: 'Análise de Editais',
    description: 'Análise completa e detalhada de documentos de licitação com IA.',
    features: ['Análise estrutural', 'Verificação legal', 'Conformidade ABNT']
  },
  {
    icon: Search,
    title: 'Revisão Inteligente',
    description: 'Revisão automatizada com detecção de inconsistências e erros.',
    features: ['Detecção de erros', 'Sugestões de melhoria', 'Análise de clareza']
  },
  {
    icon: CheckCircle,
    title: 'Validação de Conformidade',
    description: 'Verificação de conformidade com normas e legislação vigente.',
    features: ['Validação legal', 'Normas técnicas', 'Requisitos obrigatórios']
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Relatórios completos com métricas e indicadores de qualidade.',
    features: ['Dashboards interativos', 'Métricas de qualidade', 'Exportação PDF/Excel']
  },
  {
    icon: Shield,
    title: 'Segurança de Dados',
    description: 'Proteção avançada com criptografia e compliance LGPD.',
    features: ['Criptografia end-to-end', 'Compliance LGPD', 'Backup automático']
  },
  {
    icon: Zap,
    title: 'Processamento Rápido',
    description: 'Análise em tempo real com resultados em minutos.',
    features: ['IA de última geração', 'Processamento paralelo', 'Cache inteligente']
  }
];

export default function Servicos() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Nossos Serviços</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8">
            Soluções completas para análise e revisão de documentos de licitação
            com tecnologia de ponta e inteligência artificial
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="font-semibold">
              Começar Agora
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Experimente nossa plataforma gratuitamente por 14 dias.
            Sem cartão de crédito necessário.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg">Criar Conta Grátis</Button>
            </Link>
            <Link to="/contato">
              <Button size="lg" variant="outline">Falar com Vendas</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
