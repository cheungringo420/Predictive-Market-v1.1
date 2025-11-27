import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { MARKET_ABI } from '../services/contracts/contractInfo';

export interface PricePoint {
    date: Date;
    yesPrice: number;
}

export function useMarketHistory(marketAddress: `0x${string}` | undefined) {
    const publicClient = usePublicClient();

    const { data: history = [], isLoading, refetch } = useQuery({
        queryKey: ['marketHistory', marketAddress],
        queryFn: async () => {
            if (!marketAddress || !publicClient) return [];

            try {
                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 45000n; // Limit to last ~45k blocks to avoid RPC limits

                // Fetch Trade events using the ABI
                const logs = await publicClient.getContractEvents({
                    address: marketAddress,
                    abi: MARKET_ABI,
                    eventName: 'Trade',
                    fromBlock: fromBlock > 0n ? fromBlock : 'earliest',
                    toBlock: 'latest'
                });

                const points: PricePoint[] = [];
                const recentLogs = logs.slice(-50); // Process last 50 trades

                for (const log of recentLogs) {
                    const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                    const timestamp = Number(block.timestamp) * 1000;
                    const args = (log as any).args;
                    const price = Number(args.price); // 0-100

                    points.push({
                        date: new Date(timestamp),
                        yesPrice: Number(args.direction) === 0 ? price : (100 - price)
                    });
                }

                if (points.length === 0) {
                    // Add a default start point
                    points.push({ date: new Date(Date.now() - 86400000), yesPrice: 50 });
                } else {
                    points.sort((a, b) => a.date.getTime() - b.date.getTime());
                }

                return points;
            } catch (error) {
                console.error("Error fetching market history:", error);
                return [];
            }
        },
        enabled: !!marketAddress && !!publicClient,
        refetchInterval: 10000, // Refetch every 10s as a fallback
    });

    return { history, isLoading, refetch };
}
