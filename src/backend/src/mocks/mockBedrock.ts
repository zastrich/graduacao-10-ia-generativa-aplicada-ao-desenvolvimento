/**
 * Mock local do AWS Bedrock — retorna respostas simuladas para desenvolvimento.
 * Simula o comportamento do modelo Gemma 3 4b-it.
 */

import { BedrockConfig } from '../utils/types';

export interface BedrockInvokeParams {
  prompt: string;
  context: string;
  config: BedrockConfig;
}

export interface BedrockResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

class MockBedrock {
  private responses: Map<string, string> = new Map();

  constructor() {
    // Respostas pré-configuradas para cenários comuns de teste
    this.responses.set('default', 'Com base nos documentos disponíveis, posso ajudar com essa questão. ');
  }

  async invokeModel(params: BedrockInvokeParams): Promise<BedrockResponse> {
    console.log(`[MockBedrock] Invoke with config: temp=${params.config.temperature}, topP=${params.config.topP}`);
    console.log(`[MockBedrock] Prompt length: ${params.prompt.length} chars`);
    console.log(`[MockBedrock] Context length: ${params.context.length} chars`);

    // Simula latência do modelo (200-800ms)
    const latency = 200 + Math.random() * 600;
    await new Promise((resolve) => setTimeout(resolve, latency));

    const contextSnippet = params.context.substring(0, 200);
    const hasContext = params.context.trim().length > 0;

    let responseText: string;

    if (!hasContext) {
      responseText = `Não encontrei informações específicas nos documentos da base de conhecimento para responder à sua pergunta: "${params.prompt.substring(0, 100)}...". Poderia reformular ou fornecer mais detalhes?`;
    } else {
      responseText = `[Mock Bedrock - Gemma 3 4b-it]\n\n` +
        `Com base nos documentos consultados, aqui está minha análise:\n\n` +
        `**Pergunta:** ${params.prompt.substring(0, 150)}\n\n` +
        `**Contexto utilizado:** ${contextSnippet}...\n\n` +
        `**Resposta:** Esta é uma resposta simulada pelo mock do Bedrock. ` +
        `Em produção, o modelo Gemma 3 4b-it analisará os documentos reais da base ` +
        `de conhecimento e fornecerá uma resposta contextualizada e precisa.\n\n` +
        `_Parâmetros utilizados: temperatura=${params.config.temperature}, ` +
        `topP=${params.config.topP}, topK=${params.config.topK}_`;
    }

    // Simula contagem de tokens (aproximação: 1 token ≈ 4 chars)
    const inputTokens = Math.ceil((params.prompt.length + params.context.length) / 4);
    const outputTokens = Math.ceil(responseText.length / 4);

    return {
      content: responseText,
      usage: {
        inputTokens,
        outputTokens,
      },
    };
  }
}

// Singleton
export const mockBedrock = new MockBedrock();
