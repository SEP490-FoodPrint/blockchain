import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";

const { ethers } = await network.create();
const recordId = ethers.id("foodprint:batch:123");
const dataHash = ethers.id("sample data");

async function deploy() {
  const [owner, writer, reader] = await ethers.getSigners();
  const registry = await ethers.deployContract("FoodPrintHashRegistry");
  await registry.waitForDeployment();

  return {
    registry,
    owner,
    writer,
    asWriter: new ethers.Contract(await registry.getAddress(), registry.interface, writer),
    asReader: new ethers.Contract(await registry.getAddress(), registry.interface, reader),
  };
}

describe("FoodPrintHashRegistry", function () {
  it("lets the deployer confirm a hash and anyone read it", async function () {
    const { registry, owner, asReader } = await deploy();

    assert.equal(await registry.owner(), owner.address);
    const receipt = await (await registry.confirmHash(recordId, dataHash)).wait();
    assert.ok(receipt);
    const event = registry.interface.parseLog(receipt.logs[0]);
    assert.equal(event?.name, "HashConfirmed");
    assert.deepEqual(Array.from(event.args), [recordId, dataHash, owner.address]);
    assert.equal(await asReader.getHash(recordId), dataHash);
  });

  it("lets the owner grant and revoke writing permission", async function () {
    const { registry, writer, asWriter } = await deploy();

    await (await registry.setWriter(writer.address, true)).wait();
    await (await asWriter.confirmHash(recordId, dataHash)).wait();
    await (await registry.setWriter(writer.address, false)).wait();

    await assert.rejects(asWriter.confirmHash(ethers.id("other"), dataHash), /NotWriter/);
    assert.equal(await registry.getHash(recordId), dataHash);
  });

  it("rejects an unauthorized writer and prevents self-authorization", async function () {
    const { writer, asWriter } = await deploy();

    await assert.rejects(asWriter.confirmHash(recordId, dataHash), /NotWriter/);
    await assert.rejects(asWriter.setWriter(writer.address, true), /NotOwner/);
  });

  it("rejects overwrites by both the owner and an authorized writer", async function () {
    const { registry, writer, asWriter } = await deploy();

    await (await registry.confirmHash(recordId, dataHash)).wait();
    await (await registry.setWriter(writer.address, true)).wait();

    await assert.rejects(registry.confirmHash(recordId, dataHash), /AlreadyConfirmed/);
    await assert.rejects(asWriter.confirmHash(recordId, ethers.id("changed")), /AlreadyConfirmed/);
    assert.equal(await registry.getHash(recordId), dataHash);
  });

  it("rejects zero inputs and reports missing records", async function () {
    const { registry } = await deploy();

    await assert.rejects(registry.setWriter(ethers.ZeroAddress, true), /InvalidWriter/);
    await assert.rejects(registry.confirmHash(ethers.ZeroHash, dataHash), /InvalidRecordId/);
    await assert.rejects(registry.confirmHash(recordId, ethers.ZeroHash), /InvalidHash/);
    await assert.rejects(registry.getHash(recordId), /RecordNotFound/);
  });
});
