// services/createMarketService.ts
// Service helpers for market creation workflow

import type { MarketCategory } from '../types';
import {
  buildMetadataPayload,
  uploadMarketMetadata,
  encodeQuestionWithMetadata,
} from './metadataService';

export interface CreateMarketParams {
  question: string;
  description?: string;
  category?: MarketCategory;
  endDate?: Date;
  imageUrl?: string;
}

export interface QuestionPayloadResult {
  payload: string;
  metadataUri?: string;
}

export const validateMarketParams = (params: CreateMarketParams): { valid: boolean; error?: string } => {
  if (!params.question || params.question.trim().length === 0) {
    return { valid: false, error: 'Market question is required' };
  }

  if (params.question.length > 200) {
    return { valid: false, error: 'Question must be 200 characters or less' };
  }

  if (params.endDate && params.endDate <= new Date()) {
    return { valid: false, error: 'End date must be in the future' };
  }

  return { valid: true };
};

export const buildQuestionPayload = async (
  params: CreateMarketParams,
  options: { creator?: string; chainId?: number }
): Promise<QuestionPayloadResult> => {
  const metadataPayload = buildMetadataPayload(params, options.creator, options.chainId);
  const metadataUri = await uploadMarketMetadata(metadataPayload);
  const payload = encodeQuestionWithMetadata(
    params.question,
    params.description,
    metadataUri
  );

  return {
    payload,
    metadataUri,
  };
};
