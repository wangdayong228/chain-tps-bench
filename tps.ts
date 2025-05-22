import { ethers } from "ethers";
import { config } from "./config";

async function monitorTPS() {
    console.log("monitorTPS start")
    const provider = new ethers.JsonRpcProvider(config.L2_RPC_URL);

    const latestBlockNum = await provider.getBlockNumber();
    let blockNum = latestBlockNum - 10;

    const blockCaches: { time: number, block: number, txNum: number }[] = [];

    while (true) {
        // console.log(`Get block ${blockNum}`)
        const block = await provider.getBlock(blockNum);
        if (block) {
            blockCaches.push({ time: block.timestamp, block: blockNum, txNum: block.transactions.length });
            if (blockCaches.length > 10) {
                blockCaches.shift(); // 移除最旧的时间戳
            }

            if (blockCaches.length === 10) {
                const timeDifference = blockCaches[blockCaches.length - 1].time - blockCaches[0].time;
                const allTxNum = blockCaches.reduce((sum, item) => sum + item.txNum, 0);
                const tps = allTxNum / timeDifference;
                console.log(`Block ${blockCaches[0].block} ~ ${blockNum}, TxNum: ${allTxNum}, TPS: ${tps}`);
            }
            blockNum++;
        }        
        await sleep(1000);
    }
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

monitorTPS().catch(console.error);
