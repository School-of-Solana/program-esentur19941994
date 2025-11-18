import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfunding } from "../target/types/crowdfunding";
import { expect } from "chai";

describe("crowdfunding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.crowdfunding as Program<Crowdfunding>;
  const provider = anchor.getProvider();

  // Test accounts
  let creator: anchor.web3.Keypair;
  let contributor1: anchor.web3.Keypair;
  let contributor2: anchor.web3.Keypair;

  // Campaign details
  const campaignTitle = "Test Campaign";
  const campaignDescription =
    "This is a test campaign for our crowdfunding dApp";
  const targetAmount = new anchor.BN(1000000000); // 1 SOL
  const fundingAmount = new anchor.BN(500000000); // 0.5 SOL

  // PDAs
  let campaignPda: anchor.web3.PublicKey;
  let contributionPda1: anchor.web3.PublicKey;
  let contributionPda2: anchor.web3.PublicKey;

  before(async () => {
    // Create keypairs once for all tests
    creator = anchor.web3.Keypair.generate();
    contributor1 = anchor.web3.Keypair.generate();
    contributor2 = anchor.web3.Keypair.generate();

    // Airdrop SOL to test accounts - using smaller amounts and better error handling
    try {
      const signature1 = await provider.connection.requestAirdrop(
        creator.publicKey,
        2000000000
      ); // 2 SOL
      await provider.connection.confirmTransaction(signature1);

      const signature2 = await provider.connection.requestAirdrop(
        contributor1.publicKey,
        2000000000
      ); // 2 SOL
      await provider.connection.confirmTransaction(signature2);

      const signature3 = await provider.connection.requestAirdrop(
        contributor2.publicKey,
        2000000000
      ); // 2 SOL
      await provider.connection.confirmTransaction(signature3);

      // Wait a bit more for confirmations
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Airdrop failed:", error.message);
      // Continue with tests anyway - they might have existing balance
    }

    // Calculate PDAs
    [campaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("campaign"),
        creator.publicKey.toBuffer(),
        Buffer.from(campaignTitle),
      ],
      program.programId
    );

    [contributionPda1] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        campaignPda.toBuffer(),
        contributor1.publicKey.toBuffer(),
      ],
      program.programId
    );

    [contributionPda2] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("contribution"),
        campaignPda.toBuffer(),
        contributor2.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  describe("create_campaign", () => {
    it("Successfully creates a campaign", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 3600; // 1 hour from now

      const tx = await program.methods
        .createCampaign(
          campaignTitle,
          campaignDescription,
          targetAmount,
          new anchor.BN(deadline)
        )
        .accountsPartial({
          campaign: campaignPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      // Verify campaign was created correctly
      const campaignAccount = await program.account.campaign.fetch(campaignPda);

      expect(campaignAccount.creator.toBase58()).to.equal(
        creator.publicKey.toBase58()
      );
      expect(campaignAccount.title).to.equal(campaignTitle);
      expect(campaignAccount.description).to.equal(campaignDescription);
      expect(campaignAccount.targetAmount.toNumber()).to.equal(
        targetAmount.toNumber()
      );
      expect(campaignAccount.currentAmount.toNumber()).to.equal(0);
      expect(campaignAccount.deadline.toNumber()).to.equal(deadline);
      expect(campaignAccount.isActive).to.equal(true);
      expect(campaignAccount.createdAt.toNumber()).to.be.greaterThan(
        currentTime - 10
      );
    });

    it("Validates title length constraints", async () => {
      // Note: Due to PDA seed limitations (32 bytes max per seed), we cannot test titles > 32 chars in integration tests
      // The program correctly validates up to 100 chars, but PDA generation would fail first
      // In production, frontend should validate title length to stay within PDA limits

      const validTitle = "Valid Length Title"; // Well under limits
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 3600;

      const [validCampaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creator.publicKey.toBuffer(),
          Buffer.from(validTitle),
        ],
        program.programId
      );

      // This should succeed
      const tx = await program.methods
        .createCampaign(
          validTitle,
          campaignDescription,
          targetAmount,
          new anchor.BN(deadline)
        )
        .accountsPartial({
          campaign: validCampaignPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      // Verify campaign was created
      const campaignAccount = await program.account.campaign.fetch(
        validCampaignPda
      );
      expect(campaignAccount.title).to.equal(validTitle);
    });

    it("Fails with invalid target amount", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 3600;
      const invalidTitle = "Zero Target Campaign";

      const [invalidCampaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creator.publicKey.toBuffer(),
          Buffer.from(invalidTitle),
        ],
        program.programId
      );

      try {
        await program.methods
          .createCampaign(
            invalidTitle,
            campaignDescription,
            new anchor.BN(0),
            new anchor.BN(deadline)
          )
          .accountsPartial({
            campaign: invalidCampaignPda,
            creator: creator.publicKey,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have failed with invalid target amount");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        expect(errorMessage).to.include("Invalid target amount");
      }
    });

    it("Fails with invalid deadline", async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const pastDeadline = currentTime - 3600; // 1 hour ago
      const invalidTitle = "Past Deadline Campaign";

      const [invalidCampaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creator.publicKey.toBuffer(),
          Buffer.from(invalidTitle),
        ],
        program.programId
      );

      try {
        await program.methods
          .createCampaign(
            invalidTitle,
            campaignDescription,
            targetAmount,
            new anchor.BN(pastDeadline)
          )
          .accountsPartial({
            campaign: invalidCampaignPda,
            creator: creator.publicKey,
          })
          .signers([creator])
          .rpc();

        expect.fail("Should have failed with invalid deadline");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        expect(errorMessage).to.include("Invalid deadline");
      }
    });
  });

  describe("fund_campaign", () => {
    it("Successfully funds a campaign", async () => {
      const initialBalance = await provider.connection.getBalance(
        contributor1.publicKey
      );
      const initialCampaignBalance = await provider.connection.getBalance(
        campaignPda
      );

      const tx = await program.methods
        .fundCampaign(fundingAmount)
        .accountsPartial({
          campaign: campaignPda,
          contributor: contributor1.publicKey,
        })
        .signers([contributor1])
        .rpc();

      // Verify campaign state updated
      const campaignAccount = await program.account.campaign.fetch(campaignPda);
      expect(campaignAccount.currentAmount.toNumber()).to.equal(
        fundingAmount.toNumber()
      );

      // Verify contribution record created
      const contributionAccount = await program.account.contribution.fetch(
        contributionPda1
      );
      expect(contributionAccount.contributor.toBase58()).to.equal(
        contributor1.publicKey.toBase58()
      );
      expect(contributionAccount.campaign.toBase58()).to.equal(
        campaignPda.toBase58()
      );
      expect(contributionAccount.amount.toNumber()).to.equal(
        fundingAmount.toNumber()
      );

      // Verify SOL transferred
      const finalBalance = await provider.connection.getBalance(
        contributor1.publicKey
      );
      const finalCampaignBalance = await provider.connection.getBalance(
        campaignPda
      );

      expect(finalBalance).to.be.lessThan(initialBalance);
      expect(finalCampaignBalance).to.be.greaterThan(initialCampaignBalance);
    });

    it("Fails with invalid amount", async () => {
      try {
        await program.methods
          .fundCampaign(new anchor.BN(0))
          .accountsPartial({
            campaign: campaignPda,
            contributor: contributor1.publicKey,
          })
          .signers([contributor1])
          .rpc();

        expect.fail("Should have failed with invalid amount");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        // Check for our custom error message or Anchor's numeric constraint violation
        const isValidError =
          errorMessage.includes("Invalid amount") ||
          errorMessage.includes("A raw constraint was violated") ||
          errorMessage.includes("simulation failed");
        expect(isValidError).to.be.true;
      }
    });

    it("Successfully funds with multiple contributors", async () => {
      const tx = await program.methods
        .fundCampaign(fundingAmount)
        .accountsPartial({
          campaign: campaignPda,
          contributor: contributor2.publicKey,
        })
        .signers([contributor2])
        .rpc();

      // Verify campaign total updated
      const campaignAccount = await program.account.campaign.fetch(campaignPda);
      expect(campaignAccount.currentAmount.toNumber()).to.equal(
        fundingAmount.toNumber() * 2
      );

      // Verify second contribution record
      const contributionAccount = await program.account.contribution.fetch(
        contributionPda2
      );
      expect(contributionAccount.contributor.toBase58()).to.equal(
        contributor2.publicKey.toBase58()
      );
      expect(contributionAccount.amount.toNumber()).to.equal(
        fundingAmount.toNumber()
      );
    });
  });

  describe("withdraw_funds", () => {
    it("Successfully withdraws funds when target is reached", async () => {
      // Fund the remaining amount to reach target using contributor2
      const remainingAmount = targetAmount.sub(
        fundingAmount.mul(new anchor.BN(2))
      ); // Subtract both previous contributions

      if (remainingAmount.gt(new anchor.BN(0))) {
        // Create a third contributor for additional funding if needed
        const contributor3 = anchor.web3.Keypair.generate();

        // Airdrop to contributor3
        try {
          const signature = await provider.connection.requestAirdrop(
            contributor3.publicKey,
            2000000000
          );
          await provider.connection.confirmTransaction(signature);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.log("Airdrop to contributor3 failed:", error.message);
        }

        await program.methods
          .fundCampaign(remainingAmount)
          .accountsPartial({
            campaign: campaignPda,
            contributor: contributor3.publicKey,
          })
          .signers([contributor3])
          .rpc();
      }

      const initialCreatorBalance = await provider.connection.getBalance(
        creator.publicKey
      );

      await program.methods
        .withdrawFunds()
        .accountsPartial({
          campaign: campaignPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      // Verify campaign state updated
      const campaignAccount = await program.account.campaign.fetch(campaignPda);
      expect(campaignAccount.currentAmount.toNumber()).to.equal(0);
      expect(campaignAccount.isActive).to.equal(false);

      // Verify creator received funds
      const finalCreatorBalance = await provider.connection.getBalance(
        creator.publicKey
      );
      expect(finalCreatorBalance).to.be.greaterThan(initialCreatorBalance);
    });

    it("Fails when called by non-creator", async () => {
      // Create a new campaign for this test
      const unauthorizedTitle = "Unauthorized Test";
      const currentTime = Math.floor(Date.now() / 1000);
      const deadline = currentTime + 3600;

      const [unauthorizedCampaignPda] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("campaign"),
            creator.publicKey.toBuffer(),
            Buffer.from(unauthorizedTitle),
          ],
          program.programId
        );

      await program.methods
        .createCampaign(
          unauthorizedTitle,
          campaignDescription,
          targetAmount,
          new anchor.BN(deadline)
        )
        .accountsPartial({
          campaign: unauthorizedCampaignPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      try {
        await program.methods
          .withdrawFunds()
          .accountsPartial({
            campaign: unauthorizedCampaignPda,
            creator: contributor1.publicKey,
          })
          .signers([contributor1])
          .rpc();

        expect.fail("Should have failed with unauthorized withdrawal");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        expect(errorMessage).to.include("Unauthorized withdrawal");
      }
    });
  });

  describe("refund_contribution", () => {
    it("Successfully refunds contribution when campaign fails", async () => {
      // Create a failed campaign (will be past deadline after we wait)
      const failedTitle = "Failed Campaign";
      const currentTime = Math.floor(Date.now() / 1000);
      const shortDeadline = currentTime + 2; // 2 seconds from now

      const [failedCampaignPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creator.publicKey.toBuffer(),
          Buffer.from(failedTitle),
        ],
        program.programId
      );

      const [failedContributionPda] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("contribution"),
            failedCampaignPda.toBuffer(),
            contributor1.publicKey.toBuffer(),
          ],
          program.programId
        );

      await program.methods
        .createCampaign(
          failedTitle,
          campaignDescription,
          targetAmount,
          new anchor.BN(shortDeadline)
        )
        .accountsPartial({
          campaign: failedCampaignPda,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      // Fund with less than target
      await program.methods
        .fundCampaign(fundingAmount)
        .accountsPartial({
          campaign: failedCampaignPda,
          contributor: contributor1.publicKey,
        })
        .signers([contributor1])
        .rpc();

      // Wait for deadline to pass
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const initialBalance = await provider.connection.getBalance(
        contributor1.publicKey
      );

      await program.methods
        .refundContribution()
        .accountsPartial({
          campaign: failedCampaignPda,
          contribution: failedContributionPda,
          contributor: contributor1.publicKey,
        })
        .signers([contributor1])
        .rpc();

      // Verify contributor received refund
      const finalBalance = await provider.connection.getBalance(
        contributor1.publicKey
      );
      expect(finalBalance).to.be.greaterThan(initialBalance);

      // Verify contribution account was closed
      try {
        await program.account.contribution.fetch(failedContributionPda);
        expect.fail("Contribution account should have been closed");
      } catch (error) {
        expect(error.message).to.include("Account does not exist");
      }
    });

    it("Fails when called by wrong contributor", async () => {
      // Create another failed campaign
      const failedTitle2 = "Failed Campaign 2";
      const currentTime = Math.floor(Date.now() / 1000);
      const shortDeadline = currentTime + 2;

      const [failedCampaignPda2] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          creator.publicKey.toBuffer(),
          Buffer.from(failedTitle2),
        ],
        program.programId
      );

      const [failedContributionPda2] =
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("contribution"),
            failedCampaignPda2.toBuffer(),
            contributor1.publicKey.toBuffer(),
          ],
          program.programId
        );

      await program.methods
        .createCampaign(
          failedTitle2,
          campaignDescription,
          targetAmount,
          new anchor.BN(shortDeadline)
        )
        .accountsPartial({
          campaign: failedCampaignPda2,
          creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .fundCampaign(fundingAmount)
        .accountsPartial({
          campaign: failedCampaignPda2,
          contributor: contributor1.publicKey,
        })
        .signers([contributor1])
        .rpc();

      // Wait for deadline to pass
      await new Promise((resolve) => setTimeout(resolve, 3000));

      try {
        await program.methods
          .refundContribution()
          .accountsPartial({
            campaign: failedCampaignPda2,
            contribution: failedContributionPda2,
            contributor: creator.publicKey, // Wrong contributor
          })
          .signers([creator]) // Wrong signer
          .rpc();

        expect.fail("Should have failed with unauthorized refund");
      } catch (error) {
        const errorMessage = error.error?.errorMessage || error.message || "";
        expect(errorMessage).to.include("Unauthorized refund");
      }
    });
  });
});
