import { useEffect, useMemo, useState } from "react";
import { HierarchicalClassification } from "@/components/HierarchicalClassification";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClassificationTree } from "@/hooks/useClassificationData";
import type { DocumentClassification } from "@/types/document";

export default function QAClassification() {
  const [classification, setClassification] = useState<Partial<DocumentClassification>>({});
  const [isValid, setIsValid] = useState(false);
  const [debug, setDebug] = useState(false);

  const { data: tree } = useClassificationTree();

  useEffect(() => {
    document.title = "QA Classificação Hierárquica"; // SEO title
    // Meta description
    const metaId = "meta-desc-qa-classification";
    let meta = document.querySelector(
      `meta[name="description"][data-id="${metaId}"]`
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      meta.setAttribute("data-id", metaId);
      document.head.appendChild(meta);
    }
    meta.content =
      "Teste de classificação hierárquica com presets, breadcrumb e validação.";

    // Canonical tag
    const canId = "canonical-qa-classification";
    let link = document.querySelector(
      `link[rel="canonical"][data-id="${canId}"]`
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      link.setAttribute("data-id", canId);
      document.head.appendChild(link);
    }
    link.href = `${window.location.origin}/qa/classification`;
  }, []);

  useEffect(() => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.debug("[QA] classification:", classification, "valid:", isValid);
    }
  }, [classification, isValid, debug]);

  const names = useMemo(() => {
    if (!tree) return { tipo: "-", modalidade: "-", subtipo: "-", documento: "-" };
    const tipo = tree.find((n) => n.key === classification.tipoObjeto);
    const modalidade = tipo?.filhos?.find(
      (n) => n.key === classification.modalidadePrincipal
    );
    const subtipo = modalidade?.filhos?.find((n) => n.key === classification.subtipo);
    const documento = subtipo?.filhos?.find(
      (n) => n.key === classification.tipoDocumento
    );
    return {
      tipo: tipo?.nome ?? "-",
      modalidade: modalidade?.nome ?? "-",
      subtipo: subtipo?.nome ?? "-",
      documento: documento?.nome ?? "-",
    };
  }, [tree, classification]);

  // Presets
  const setFullPath = () =>
    setClassification({
      tipoObjeto: "aquisicao",
      modalidadePrincipal: "contratacao_direta",
      subtipo: "dispensa",
      tipoDocumento: "etp",
    });
  const setShortPath = () =>
    setClassification({
      tipoObjeto: "aquisicao",
      modalidadePrincipal: "alteracoes_contratuais",
    });
  const resetAll = () => setClassification({});

  return (
    <div className="min-h-screen bg-gradient-to-br from-government-50 to-government-100">
      <header className="px-4 pt-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">QA Classificação Hierárquica</h1>
          <p className="text-gray-600 mt-1">
            Página de validação do componente de classificação com presets.
          </p>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-5xl mx-auto grid gap-6">
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Component Tester</CardTitle>
                <CardDescription>
                  Selecione manualmente ou use os presets abaixo para testar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={setFullPath} variant="default">
                    Preset: Caminho Completo
                  </Button>
                  <Button onClick={setShortPath} variant="secondary">
                    Preset: Caminho Curto
                  </Button>
                  <Button onClick={resetAll} variant="outline">
                    Reset
                  </Button>
                  <Button
                    onClick={() => setDebug((d) => !d)}
                    variant={debug ? "destructive" : "ghost"}
                  >
                    {debug ? "Debug: ON" : "Debug: OFF"}
                  </Button>
                </div>

                <div className="rounded-md border p-3 bg-white">
                  <HierarchicalClassification
                    classification={classification}
                    onClassificationChange={setClassification}
                    onValidationChange={setIsValid}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Status atual</CardTitle>
                <CardDescription>Chaves e nomes resolvidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isValid ? "default" : "secondary"}>
                    {isValid ? "Válido" : "Incompleto"}
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium text-gray-700">Tipo de Objeto:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-gray-500">{classification.tipoObjeto || '-'}</code>
                        <span className="text-gray-900">{names.tipo}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Modalidade Principal:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-gray-500">{classification.modalidadePrincipal || '-'}</code>
                        <span className="text-gray-900">{names.modalidade}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="font-medium text-gray-700">Subtipo:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-gray-500">{classification.subtipo || '-'}</code>
                        <span className="text-gray-900">{names.subtipo}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tipo de Documento:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-gray-500">{classification.tipoDocumento || '-'}</code>
                        <span className="text-gray-900">{names.documento}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
