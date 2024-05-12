const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GeneNFT", function () {
  async function deployNftFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const nft = await ethers.deployContract("GeneNFT")

    return { nft, owner, addr1, addr2 }
  }

  describe("Deployment", function () {
    it("Should set the right name", async function () {
      const { nft } = await loadFixture(deployNftFixture);

      expect(await nft.name()).to.equal("GeneNFT")
      expect(await nft.symbol()).to.equal("GNFT")
    });

    it("Should mint to correct owner", async function () {
      const { nft, owner, addr1 } = await loadFixture(deployNftFixture);

      await nft.safeMint(addr1);

      expect(await nft.balanceOf(addr1)).to.equal(1);

    });

    it("Should mint to correct token id", async function () {
      const { nft, owner, addr1, addr2 } = await loadFixture(deployNftFixture);

      await nft.safeMint(addr1)
      await nft.safeMint(addr2)

      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    })
  })

})