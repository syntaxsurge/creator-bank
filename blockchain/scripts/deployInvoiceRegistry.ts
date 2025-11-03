import hre from "hardhat";

import { updateEnvLog } from "./utils/logEnv";
import { shouldVerifyNetwork } from "./utils/verify";

async function main() {
  const { ethers, network } = hre;

  console.log(`\n🚀 Deploying InvoiceRegistry to '${network.name}'…`);

  const factory = await ethers.getContractFactory("InvoiceRegistry");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ InvoiceRegistry deployed at ${address}`);

  updateEnvLog("INVOICE_REGISTRY_CONTRACT_ADDRESS", address);

  if (shouldVerifyNetwork(network.name)) {
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("🔍 Verification submitted for Mezo explorer review");
    } catch (err) {
      console.warn(
        "⚠️ Verification failed:",
        err instanceof Error ? err.message : err,
      );
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
