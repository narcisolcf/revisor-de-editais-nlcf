import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Award, TrendingUp } from 'lucide-react';

export default function Sobre() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Sobre Nós</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Transformando a análise de documentos de licitação com inteligência artificial
            e tecnologia de ponta
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nossa Missão</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Objetivo</h3>
                <p className="text-gray-600">
                  Simplificar e automatizar a análise de documentos de licitação,
                  reduzindo tempo e custos para órgãos públicos e empresas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Valores</h3>
                <p className="text-gray-600">
                  Transparência, eficiência e inovação são os pilares que guiam
                  nossa atuação e desenvolvimento de soluções.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Equipe</h3>
                <p className="text-gray-600">
                  Time multidisciplinar com especialistas em IA, direito público,
                  licitações e desenvolvimento de software.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Crescimento</h3>
                <p className="text-gray-600">
                  Em constante evolução, com atualizações frequentes e novas
                  funcionalidades baseadas no feedback dos usuários.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Nossa História</h2>
            <div className="prose prose-lg mx-auto">
              <p className="text-gray-700 leading-relaxed mb-4">
                O LicitaReview nasceu da necessidade de simplificar o complexo processo
                de análise de documentos de licitação. Com anos de experiência no setor
                público e privado, nossa equipe identificou que a análise manual de editais
                era demorada, propensa a erros e custosa.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Desenvolvemos uma solução baseada em inteligência artificial que automatiza
                grande parte desse processo, mantendo a precisão e adicionando camadas de
                validação que seriam impossíveis manualmente.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Hoje, ajudamos dezenas de organizações a economizar tempo e recursos,
                garantindo conformidade e qualidade em seus processos licitatórios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Documentos Analisados</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
            <div className="text-gray-600">Taxa de Precisão</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">70%</div>
            <div className="text-gray-600">Redução de Tempo</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-gray-600">Clientes Ativos</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Quer saber mais?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Entre em contato conosco para conhecer melhor nossa plataforma
            e como podemos ajudar sua organização.
          </p>
          <Link to="/contato">
            <Button size="lg">Entrar em Contato</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
