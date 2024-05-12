const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Controller", function () {
  async function deployControllerFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const nft = await ethers.deployContract("GeneNFT");
    const pcspToken = await ethers.deployContract("PostCovidStrokePrevention");

    const controller = await ethers.deployContract("Controller", [nft.target, pcspToken.target]);

    await nft.transferOwnership(controller.target)
    await pcspToken.transferOwnership(controller.target)

    return { controller, nft, pcspToken, owner, addr1, addr2 }
  }

  describe("Upload Data", function () {
    it("Should receive session id", async function () {
      const { controller } = await loadFixture(deployControllerFixture);

      await expect(
        controller.uploadData("doc1")
      )
        .to.emit(controller, "UploadData")
        .withArgs("doc1", 0)
    })

    it("Should fail if the doc is submited", async function () {
      const { controller, addr1, addr2 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      await expect(
        controller.connect(addr2).uploadData(docId)
      ).to.be.revertedWith("Doc already been submitted")
    })
  })

  describe("Confirm data", function () {
    it("Should receive correct nft", async function () {
      const { controller, nft, owner } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.uploadData(docId)
      await controller.confirm(docId, contentHash, proof, sessionId, riskScore)

      expect(await nft.ownerOf(0)).to.equal(owner.address);
    })

    it("Should receive correct pcsp reward", async function () {
      const { controller, pcspToken, addr1 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      const awardAmount = BigInt("15000") * BigInt("10") ** BigInt("18")

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      const ownerBalance = await pcspToken.balanceOf(addr1.address)

      expect(ownerBalance).to.equal(awardAmount)
    })

    it("Should close session", async function () {
      const { controller, addr1 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      const session = await controller.getSession(sessionId)

      expect(session.proof).to.equal(proof)
      expect(session.confirmed).to.equal(true)
    })

    it("Should content hash uploaded", async function () {
      const { controller, addr1 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      const doc = await controller.getDoc(docId)

      expect(doc.hashContent).to.equal(contentHash)
    })

    it("Should fail if the doc is submitted", async function () {
      const { controller, addr1 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      await expect(
        controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)
      ).to.be.revertedWith("Doc already been submitted")
    })

    it("Should fail if the session owner is invalid", async function () {
      const { controller, addr1, addr2 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)

      await expect(
        controller.connect(addr2).confirm(docId, contentHash, proof, sessionId, riskScore)
      ).to.be.revertedWith("Invalid session owner")
    })

    it("Should fail if the session is end", async function () {
      const { controller, addr1 } = await loadFixture(deployControllerFixture);

      const docId = "doc1"
      const docId2 = "doc2"
      const contentHash = "dochash"
      const proof = "success"
      const riskScore = 1
      const sessionId = 0

      await controller.connect(addr1).uploadData(docId)
      await controller.connect(addr1).confirm(docId, contentHash, proof, sessionId, riskScore)

      await expect(
        controller.connect(addr1).confirm(docId2, contentHash, proof, sessionId, riskScore)
      ).to.be.revertedWith("Session is ended")
    })
  })
})