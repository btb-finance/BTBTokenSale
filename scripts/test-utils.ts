import { ethers } from "hardhat";

export async function createTestWallet(fundingAmount: string = "0.0001") {
    const [owner] = await ethers.getSigners();
    const wallet = ethers.Wallet.createRandom().connect(ethers.provider);
    
    // Fund the wallet with minimum amount needed for test transactions
    await owner.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther(fundingAmount)
    });
    
    return wallet;
}

export async function logBalances(tokenContract: any, ...addresses: string[]) {
    console.log("\nBalance Check:");
    for (const address of addresses) {
        const ethBalance = await ethers.provider.getBalance(address);
        const tokenBalance = await tokenContract.balanceOf(address);
        console.log(`${address.slice(0, 6)}...:`);
        console.log(`  ETH: ${ethers.formatEther(ethBalance)}`);
        console.log(`  BTB: ${ethers.formatEther(tokenBalance)}`);
    }
}

export async function expectRevert(promise: Promise<any>, expectedError?: string) {
    try {
        await promise;
        console.log("❌ Expected transaction to revert but it succeeded");
        return false;
    } catch (error: any) {
        if (expectedError) {
            const includes = error.message.includes(expectedError);
            console.log(includes ? "✅ Reverted as expected" : `❌ Wrong error: ${error.message}`);
            return includes;
        }
        console.log("✅ Reverted as expected");
        return true;
    }
}

export function logTestResult(testName: string, success: boolean) {
    console.log(`\n${success ? "✅" : "❌"} ${testName}: ${success ? "PASSED" : "FAILED"}`);
}

export async function mineBlocks(blocks: number) {
    for (let i = 0; i < blocks; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

export async function increaseTime(seconds: number) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
}

export async function getEventArgs(tx: any, eventName: string) {
    const receipt = await tx.wait();
    const event = receipt.events?.find((e: any) => e.event === eventName);
    return event ? event.args : null;
}

export function formatTokenAmount(amount: bigint) {
    return `${ethers.formatEther(amount)} BTB`;
}
