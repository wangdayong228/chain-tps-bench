import { ethers } from "ethers";
import { numberToPrivateKey } from "./utils";
import { config } from "./config";
import { genWallets } from "./utils";


const WALLET_COUNT = 10

// 设置网络和连接 provider（可以使用 Infura 或 Alchemy）
const provider = new ethers.JsonRpcProvider(config.L2_RPC_URL);
const { processId, totalTxNum } = parseArgv()

// 发送交易函数
async function sendTransactions(wallets: ethers.Wallet[]) {
    const perAccountBatchSendNumOnce = totalTxNum / WALLET_COUNT;
    let toPrivkeyStartInTotal = processId * totalTxNum + 1; // 接受者地址的私钥
    console.log("start toPrivkeyStartInTotal:", toPrivkeyStartInTotal, "perAccountBatchSendNumOnce", perAccountBatchSendNumOnce)

    // const lastTxs: string[] = []

    const promises = []
    for (let i = 0; i < wallets.length; i++) {
        promises.push(sendTxByOneWallet(i, wallets[i], perAccountBatchSendNumOnce, toPrivkeyStartInTotal + (perAccountBatchSendNumOnce * i)));
    }
    const lastTxs = await Promise.all(promises)

    await Promise.all(lastTxs.map(tx => provider.waitForTransaction(tx)))
    console.log("all txs mined")
}

async function sendTxByOneWallet(walletIndex: number, wallet: ethers.Wallet, perAccountBatchSendNumOnce: number, toPrivkeyStart: number): Promise<string> {
    // const wallet = wallets[i];
    console.log("start toPrivkey:", toPrivkeyStart, "perAccountBatchSendNumOnce", perAccountBatchSendNumOnce)
    let toPrivkey = toPrivkeyStart;
    const gasPrice = await provider.getFeeData().then(feeData => feeData.gasPrice);
    // 获取当前 nonce
    var nonce = await wallet.getNonce();
    for (let j = 0; j < perAccountBatchSendNumOnce; j++) {

        const to = config.IS_RECEIVER_BY_PK ?
            new ethers.Wallet(numberToPrivateKey(toPrivkey), provider).address :
            wallet.address;

        try {
            // 创建交易数据
            const tx: ethers.TransactionRequest = {
                nonce,
                gasLimit: 21000, // 适用于简单的转账交易
                gasPrice: gasPrice!,
                to,
                value: ethers.parseEther("0.000000000000000001"), // 每次转账 1 wei
                data: "0x", // 数据字段为空
            };

            // 签名并发送交易
            const txResp = await wallet.sendTransaction(tx);
            console.log(`sent tx, process ${processId} wallet ${walletIndex} nonce ${nonce} to ${to} pk ${toPrivkey} hash ${txResp.hash}`);
            nonce++;
            toPrivkey++;

            if (j == perAccountBatchSendNumOnce - 1) {
                return txResp.hash;
            }
        } catch (error) {
            console.error(`Failed to send transaction for ${wallet.address}:`, error);
        }
    }
    throw new Error("send tx failed")
}

function parseArgv() {
    if (process.argv.length < 4) {
        console.error("miss start privatekey and end privatekey")
        process.exit(1)
    }
    // 进程 id，用于计算from的地址和 to 的地址； 
    // from 地址为从 id*WALLET_COUNT+1 ～ id*WALLET_COUNT+WALLET_COUNT; 
    // to 地址为从 id*txNum+1 ～ id*txNum+txNum
    const processId = parseInt(process.argv[2]);
    const totalTxNum = parseInt(process.argv[3]);
    return { processId, totalTxNum };
}

// 主函数
async function main(): Promise<void> {
    const wallets = genWallets(WALLET_COUNT, processId * WALLET_COUNT + 1, provider);
    console.log("wallets length", wallets.length)
    await sendTransactions(wallets);
}

// 启动脚本
main().catch(console.error);
