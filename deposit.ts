import { ethers } from "ethers";
// import { numberToPrivateKey } from "./utils";
import { config } from "./config";
import { genWallets } from "./utils";

// const WALLET_COUNT = 500

// 设置网络和连接 provider
const provider = new ethers.JsonRpcProvider(config.L2_RPC_URL);
const adminWallet = new ethers.Wallet(config.ADMIN_PRIVATE_KEY!, provider);

async function depositEth(wallets: ethers.Wallet[], amountPerWallet: bigint) {

    const nonce = await adminWallet.getNonce()

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const tx = await adminWallet.sendTransaction({
            to: wallet.address,
            value: amountPerWallet,
            nonce: nonce + i,
        });
        console.log(`Deposit to ${i} wallet ${wallet.address} with nonce ${tx.nonce} with amount ${ethers.formatEther(amountPerWallet)}: ${tx.hash}`);
        if (i == wallets.length - 1) {
            await provider.waitForTransaction(tx.hash); 
        }
    }
}

// 主函数
async function main(): Promise<void> {
    const walletCount = parseInt(process.argv[2]) || 10;
    const amountPerWallet =  ethers.parseEther(process.argv[3] || "1");
    const wallets = genWallets(walletCount, 1, provider);
    console.log("wallets", wallets)
    await depositEth(wallets, amountPerWallet);
    console.log("deposit success")
}

// 启动脚本
main().catch(console.error);