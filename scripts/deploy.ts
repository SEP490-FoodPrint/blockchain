import { mkdir, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { network } from "hardhat";

const { ethers, networkName } = await network.create();
const contractName = "FoodPrintHashRegistry";
const { chainId } = await ethers.provider.getNetwork();
const contract = await ethers.deployContract(contractName);
await contract.waitForDeployment();

const deployment = {
  contractName,
  chainId: Number(chainId),
  address: await contract.getAddress(),
  abi: JSON.parse(contract.interface.formatJson()),
};

const directory = new URL(`../deployments/${networkName}/`, import.meta.url);
await mkdir(directory, { recursive: true });

const output = new URL(`${contractName}.json`, directory);
const temporary = new URL(`.${contractName}-${randomUUID()}.tmp`, directory);
await writeFile(temporary, JSON.stringify(deployment, null, 2) + "\n");
await rename(temporary, output);
console.log(`${contractName} deployed to ${deployment.address} on ${networkName} (${chainId})`);
