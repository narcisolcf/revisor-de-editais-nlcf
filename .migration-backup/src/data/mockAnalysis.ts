export const mockAnalysisResults = {
  conformidade: [
    { name: "Conforme", value: 75, color: "#22C55E" },
    { name: "Atenção", value: 15, color: "#F59E0B" },
    { name: "Não Conforme", value: 10, color: "#EF4444" }
  ],
  problemas: [
    { categoria: "Prazos", quantidade: 3, gravidade: "alta", color: "#EF4444" },
    { categoria: "Cláusulas", quantidade: 5, gravidade: "media", color: "#F59E0B" },
    { categoria: "Critérios", quantidade: 2, gravidade: "baixa", color: "#22C55E" },
    { categoria: "Documentação", quantidade: 1, gravidade: "critica", color: "#DC2626" }
  ],
  scoreGeral: 78,
  recomendacoes: [
    "Revisar prazos de entrega especificados no edital",
    "Incluir cláusula sobre garantia dos produtos",
    "Detalhar critérios de julgamento técnico",
    "Verificar documentação de habilitação exigida"
  ]
};
