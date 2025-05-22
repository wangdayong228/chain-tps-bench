import { ethers } from "ethers";

function numberToPrivateKey(num: number): string {
    return '0x' + num.toString(16).padStart(64, '0');
}

function genWallets(count: number, start: number, provider: ethers.JsonRpcProvider): ethers.Wallet[] {
    const wallets: ethers.Wallet[] = [];
    for (let i = 0; i < count; i++) {
        const wallet = new ethers.Wallet(numberToPrivateKey(start + i), provider).connect(provider);
        wallets.push(wallet);
        console.log(`gen wallet, pk number${start + i}, address ${wallet.address}`)
    }
    return wallets;
}

export { numberToPrivateKey, genWallets }