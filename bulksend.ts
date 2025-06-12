import { ethers } from "ethers";
import { numberToPrivateKey } from "./utils";
import { config } from "./config";
import { genWallets } from "./utils";

console.log("config", config)

const WALLET_COUNT = 500
const ACCOUNT_MAX_PENDING = 15

// 设置网络和连接 provider（可以使用 Infura 或 Alchemy）
const provider = (() => {
    if (config.L2_RPC_URL!.startsWith("ws://")) {
        return new ethers.WebSocketProvider(config.L2_RPC_URL!);
    }
    return new ethers.JsonRpcProvider(config.L2_RPC_URL!);
})()
const { processId, totalTxNum } = parseArgv()

// 发送交易函数
async function sendTransactions(wallets: ethers.Wallet[]) {
    const perAccountBatchSendNumOnce = Math.ceil(totalTxNum / WALLET_COUNT);
    let toPrivkeyStartInTotal = processId * totalTxNum + 1; // 接受者地址的私钥
    console.log("start toPrivkeyStartInTotal:", toPrivkeyStartInTotal, "perAccountBatchSendNumOnce", perAccountBatchSendNumOnce)

    const walletLen = Math.min(wallets.length, totalTxNum)
    const promises = []
    for (let i = 0; i < walletLen; i++) {
        promises.push(sendTxByOneWallet(i, wallets[i], perAccountBatchSendNumOnce, toPrivkeyStartInTotal + (perAccountBatchSendNumOnce * i)));
    }
    await Promise.all(promises)
    // await Promise.all(lastTxs.map(tx => provider.waitForTransaction(tx)))
    console.log("all txs mined")
}

async function sendTxByOneWallet(walletIndex: number, wallet: ethers.Wallet, perAccountBatchSendNumOnce: number, toAccountStart: number) {
    // const wallet = wallets[i];
    console.log("start toPrivkey:", toAccountStart, "perAccountBatchSendNumOnce", perAccountBatchSendNumOnce)

    const loopCount = Math.ceil(perAccountBatchSendNumOnce / ACCOUNT_MAX_PENDING)
    let toAccount = toAccountStart;

    for (let i = 0; i < loopCount; i++) {
        const start = i * ACCOUNT_MAX_PENDING;
        const end = Math.min(start + ACCOUNT_MAX_PENDING, perAccountBatchSendNumOnce) - 1;

        // 获取当前 nonce
        var nonce = await wallet.getNonce();
        const gasPrice = await provider.getFeeData().then(feeData => feeData.gasPrice);

        for (let j = start; j <= end; j++) {
            const to = config.IS_RECEIVER_BY_PK ?
                new ethers.Wallet(numberToPrivateKey(toAccount), provider).address :
                '0x' + toAccount.toString(16).padStart(40, '0');

            let msg = ""
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
                msg = `send tx, process ${processId} wallet ${walletIndex} nonce ${nonce} to ${to} (${config.IS_RECEIVER_BY_PK ? 'pk' : 'address'} ${toAccount})`;
                const txResp = await wallet.sendTransaction(tx);
                msg += ` hash ${txResp.hash} success`
                console.log(msg)

                nonce++;
                toAccount++;
                if (j == end) {
                    await provider.waitForTransaction(txResp.hash)
                }
            } catch (error) {
                msg += ` failed.\n`;
                console.error(msg, error)
            }
        }
        console.log(`====== account ${walletIndex} address ${wallet.address} loop ${i} count ${end - start + 1} sent and mined ======`)
    }
    // throw new Error("send tx failed")
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
