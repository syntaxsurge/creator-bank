import hre from "hardhat";

import { adminAddress, membershipURI } from "./config";
import { updateEnvLog } from "./utils/logEnv";
import { shouldVerifyNetwork } from "./utils/verify";

async function main() {
  const { ethers, network } = hre;

  console.log(`\n🚀 Deploying MembershipPass1155 to '${network.name}'…`);
  console.log(`   · admin: ${adminAddress}`);
  console.log(`   · uri:   ${membershipURI}`);

  const factory = await ethers.getContractFactory("MembershipPass1155");
  const contract = await factory.deploy(membershipURI, adminAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ MembershipPass1155 deployed at ${address}`);

  updateEnvLog("MEMBERSHIP_CONTRACT_ADDRESS", address);

  if (shouldVerifyNetwork(network.name)) {
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments: [membershipURI, adminAddress],
      });
      console.log("🔍 Verification submitted for Mezo explorer review");
    } catch (err) {
      console.warn("⚠️ Verification failed:", err instanceof Error ? err.message : err);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
