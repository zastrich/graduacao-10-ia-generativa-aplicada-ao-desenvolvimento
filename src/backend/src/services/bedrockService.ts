/**
 * Bedrock Service — abstrai inferência do AWS Bedrock usando mock local ou SDK real.
 */

import { config } from '../utils/config';
import { mockBedrock, BedrockInvokeParams, BedrockResponse } from '../mocks/mockBedrock';
import { BedrockConfig } from '../utils/types';

let bedrockClient: any = null;
let InvokeModelCommand: any = null;

async function getAWSClient() {
  if (config.isLocal) return null;

  if (!bedrockClient) {
    const bedrock = await import('@aws-sdk/client-bedrock-runtime');
    bedrockClient = new bedrock.BedrockRuntimeClient({ region: config.aws.region });
    InvokeModelCommand = bedrock.InvokeModelCommand;
  }
  return bedrockClient;
}

export const bedrockService = {
  async invoke(prompt: string, context: string, bedrockConfig: BedrockConfig): Promise<BedrockResponse> {
    const params: BedrockInvokeParams = { prompt, context, config: bedrockConfig };

    if (config.isLocal) {
      return mockBedrock.invokeModel(params);
    }

    const client = await getAWSClient();
    
    // Monta o prompt completo com system prompt e contexto
    const fullPrompt = buildFullPrompt(prompt, context, bedrockConfig);

    const requestBody = {
      prompt: fullPrompt,
      max_tokens: bedrockConfig.maxTokens,
      temperature: bedrockConfig.temperature,
      top_p: bedrockConfig.topP,
      top_k: bedrockConfig.topK,
    };

    const response = await client.send(new InvokeModelCommand({
      modelId: config.aws.bedrockModelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    }));

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return {
      content: responseBody.generated_text || responseBody.completion || responseBody.outputs?.[0]?.text || 'Sem resposta do modelo.',
      usage: {
        inputTokens: responseBody.usage?.input_tokens || 0,
        outputTokens: responseBody.usage?.output_tokens || 0,
      },
    };
  },
};

function buildFullPrompt(userPrompt: string, context: string, bedrockConfig: BedrockConfig): string {
  const systemPrompt = bedrockConfig.systemPrompt;

  let fullPrompt = `<start_of_turn>system\n${systemPrompt}\n`;

  if (context.trim()) {
    fullPrompt += `\nContexto dos documentos da base de conhecimento:\n---\n${context}\n---\n`;
  }

  fullPrompt += `<end_of_turn>\n<start_of_turn>user\n${userPrompt}<end_of_turn>\n<start_of_turn>model\n`;

  return fullPrompt;
}
