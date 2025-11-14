// services/createMarketService.ts
// Service to create new markets using MarketFactoryV2 contract

import { getFactoryAddress } from './contracts/contractInfo';
import type { MarketCategory } from '../types';

export interface CreateMarketParams {
  question: string;
  description?: string;
  category?: MarketCategory;
  endDate?: Date;
  imageUrl?: string;
}

/**
 * Validates market creation parameters
 */
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

/**
 * Formats market question for blockchain storage
 * Combines question and description if provided
 */
export const formatMarketQuestion = (params: CreateMarketParams): string => {
  if (params.description && params.description.trim().length > 0) {
    return `${params.question}\n\n${params.description}`;
  }
  return params.question;
};

