export interface ClassificationLeadData {
  fullName: string;
  email: string;
  companyName: string;
  companyCnpj: string;
  estimatedValue?: number;
  notes?: string;
  enrichmentData: Record<string, unknown>;
}

export const CLASSIFICATION_PROMPT_TEMPLATE = (lead: ClassificationLeadData): string => `
Você é um especialista em B2B sales prospecting. Analise os dados abaixo e retorne APENAS um JSON válido, sem markdown ou explicações extras.

DADOS DO LEAD:
- Nome: ${lead.fullName}
- Email: ${lead.email}
- Empresa: ${lead.companyName}
- CNPJ: ${lead.companyCnpj}
- Valor Estimado: ${lead.estimatedValue ?? 'Não informado'}
- Notas: ${lead.notes ?? 'Sem notas'}

DADOS DE ENRIQUECIMENTO:
${JSON.stringify(lead.enrichmentData, null, 2)}

Retorne SOMENTE este JSON (sem markdown, sem explicações):
{
  "score": <número de 0 a 100>,
  "classification": "<HOT|WARM|COLD>",
  "justification": "<justificativa em português>",
  "commercialPotential": "<HIGH|MEDIUM|LOW>"
}
`;
