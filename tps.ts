import { ethers } from "ethers";
import { config } from "./config";

async function monitorTPS() {
    console.log("monitorTPS start")
    const provider = new ethers.JsonRpcProvider(config.L2_RPC_URL);

    const latestBlockNum = parseInt(process.argv[2]) || await provider.getBlockNumber();
    const blockCnt = 11;
    let blockNum = latestBlockNum - blockCnt;

    const blockCaches: { time: number, block: number, txNum: number }[] = [];

    while (true) {
        // console.log(`Get block ${blockNum}`)
        const block = await provider.getBlock(blockNum);
        if (block) {
            blockCaches.push({ time: block.timestamp, block: blockNum, txNum: block.transactions.length });
            if (blockCaches.length > blockCnt) {
                blockCaches.shift(); // 移除最旧的时间戳
            }

            // 计算从第2个开始区块的 TPS，因为第1个区块的时间戳到第N个区块的时间戳产生了第2-N个区块
            if (blockCaches.length === blockCnt) {
                const timeDifference = blockCaches[blockCaches.length - 1].time - blockCaches[0].time;
                const allTxNum = blockCaches.slice(1).reduce((sum, item) => sum + item.txNum, 0);
                const tps = allTxNum / timeDifference;
                console.log(`Block ${blockCaches[1].block} ~ ${blockNum}, TxNum: ${allTxNum}, TPS: ${tps}`);
            }
            blockNum++;
        }        
        await sleep(50);
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

monitorTPS().catch(console.error);
