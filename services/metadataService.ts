import { Buffer } from 'buffer';
import type { MarketCategory } from '../types';

const METADATA_PREFIX = '<metadata:';
const METADATA_SUFFIX = '>';
const DEFAULT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface MarketMetadataPayload {
  question: string;
  description?: string;
  category?: MarketCategory;
  endDate?: string;
  imageUrl?: string;
  createdBy?: string;
  chainId?: number;
  createdAt: string;
  metadataVersion: string;
}

const encodeBase64 = (value: string) => {
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(unescape(encodeURIComponent(value)));
  }
  return Buffer.from(value, 'utf-8').toString('base64');
};

const decodeBase64 = (value: string) => {
  if (typeof window !== 'undefined' && window.atob) {
    return decodeURIComponent(escape(window.atob(value)));
  }
  return Buffer.from(value, 'base64').toString('utf-8');
};

export const uploadMarketMetadata = async (metadata: MarketMetadataPayload): Promise<string | undefined> => {
  try {
    const pinataJwt = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJwt) {
      const base64 = encodeBase64(JSON.stringify(metadata));
      return `data:application/json;base64,${base64}`;
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: JSON.stringify({ pinataContent: metadata }),
    });

    if (!response.ok) {
      console.error('Failed to upload metadata to Pinata', await response.text());
      return undefined;
    }

    const data = await response.json();
    return data?.IpfsHash ? `ipfs://${data.IpfsHash}` : undefined;
  } catch (error) {
    console.error('Metadata upload failed:', error);
    return undefined;
  }
};

export const buildMetadataPayload = (
  params: {
    question: string;
    description?: string;
    category?: MarketCategory;
    endDate?: Date;
    imageUrl?: string;
  },
  creator?: string,
  chainId?: number
): MarketMetadataPayload => ({
  question: params.question.trim(),
  description: params.description?.trim() || undefined,
  category: params.category,
  endDate: params.endDate ? params.endDate.toISOString() : undefined,
  imageUrl: params.imageUrl?.trim() || undefined,
  createdBy: creator,
  chainId,
  createdAt: new Date().toISOString(),
  metadataVersion: 'ph-v1',
});

export const encodeQuestionWithMetadata = (
  baseQuestion: string,
  description?: string,
  metadataUri?: string
) => {
  let formatted = baseQuestion.trim();
  if (description && description.trim().length > 0) {
    formatted += `\n\n${description.trim()}`;
  }
  if (metadataUri) {
    formatted += `\n\n${METADATA_PREFIX}${metadataUri}${METADATA_SUFFIX}`;
  }
  return formatted;
};

export const extractMetadataMarker = (rawQuestion: string) => {
  const markerStart = rawQuestion.lastIndexOf(METADATA_PREFIX);
  if (markerStart === -1) {
    return { questionText: rawQuestion.trim(), metadataUri: undefined };
  }

  const markerEnd = rawQuestion.indexOf(METADATA_SUFFIX, markerStart);
  if (markerEnd === -1) {
    return { questionText: rawQuestion.trim(), metadataUri: undefined };
  }

  const metadataUri = rawQuestion.slice(markerStart + METADATA_PREFIX.length, markerEnd).trim();
  const questionText = rawQuestion.slice(0, markerStart).trim();
  return { questionText, metadataUri };
};

export const fetchMetadataFromUri = async (
  uri?: string
): Promise<MarketMetadataPayload | undefined> => {
  if (!uri) return undefined;

  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const base64 = uri.replace('data:application/json;base64,', '');
      return JSON.parse(decodeBase64(base64));
    }

    const gateway = import.meta.env.VITE_IPFS_GATEWAY || DEFAULT_GATEWAY;
    const resolvedUri = uri.startsWith('ipfs://')
      ? `${gateway}${uri.replace('ipfs://', '')}`
      : uri;

    const response = await fetch(resolvedUri);
    if (!response.ok) {
      console.error('Failed to fetch metadata from', resolvedUri, await response.text());
      return undefined;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return undefined;
  }
};

export const parseQuestionMetadata = async (rawQuestion: string) => {
  const { questionText, metadataUri } = extractMetadataMarker(rawQuestion);
  const metadata = await fetchMetadataFromUri(metadataUri);
  return { questionText, metadataUri, metadata };
};
