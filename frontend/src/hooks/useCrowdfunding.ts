import { useProgram } from "@/contexts/ProgramContext";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import BN from "bn.js";
import { PROGRAM_ID } from "@/lib/constants";

export const useCrowdfunding = () => {
  const { program } = useProgram();
  const wallet = useWallet();

  const createCampaign = async (
    title: string,
    description: string,
    targetAmount: number,
    deadline: Date
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error("Program or wallet not available");
    }

    try {
      const targetAmountLamports = new BN(targetAmount * LAMPORTS_PER_SOL);
      const deadlineTimestamp = new BN(Math.floor(deadline.getTime() / 1000));
      const currentTimestamp = Math.floor(Date.now() / 1000);

      // Validate inputs before sending to program
      if (title.length === 0) {
        throw new Error("Title cannot be empty");
      }
      if (title.length > 100) {
        throw new Error("Title too long (max 100 characters)");
      }
      if (description.length === 0) {
        throw new Error("Description cannot be empty");
      }
      if (description.length > 500) {
        throw new Error("Description too long (max 500 characters)");
      }
      if (targetAmount <= 0) {
        throw new Error("Target amount must be greater than 0");
      }
      if (deadlineTimestamp.toNumber() <= currentTimestamp) {
        throw new Error("Deadline must be in the future");
      }

      const [campaignPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("campaign"),
          wallet.publicKey.toBuffer(),
          Buffer.from(title, "utf8"),
        ],
        PROGRAM_ID
      );

      // Check wallet balance
      const balance = await program.provider.connection.getBalance(
        wallet.publicKey
      );

      if (balance < 0.01 * LAMPORTS_PER_SOL) {
        throw new Error(
          "Insufficient balance. Need at least 0.01 SOL for rent and transaction fees."
        );
      }

      // Check if account already exists
      try {
        const existingAccount =
          await program.provider.connection.getAccountInfo(campaignPda);
        if (existingAccount) {
          throw new Error(
            `Campaign account already exists at ${campaignPda.toString()}`
          );
        }
      } catch (accountCheckError) {
        if (
          accountCheckError instanceof Error &&
          accountCheckError.message.includes("already exists")
        ) {
          throw accountCheckError;
        }
      }

      // Verify the program account exists on chain
      try {
        const programAccount = await program.provider.connection.getAccountInfo(
          PROGRAM_ID
        );
        if (!programAccount) {
          throw new Error("Program account not found on chain");
        }
      } catch (programCheckError) {
        throw new Error(
          `Cannot verify program exists on chain: ${programCheckError}`
        );
      }

      // Check if the method exists before calling it
      if (!program.methods.createCampaign) {
        throw new Error("createCampaign method not available on program");
      }

      const simulationBuilder = program.methods
        .createCampaign(
          title,
          description,
          targetAmountLamports,
          deadlineTimestamp
        )
        .accounts({
          campaign: campaignPda,
          creator: wallet.publicKey,
          system_program: SystemProgram.programId,
        });

      await simulationBuilder.simulate();

      // If simulation succeeds, proceed with actual transaction
      const tx = await simulationBuilder.rpc({
        commitment: "confirmed",
        skipPreflight: false,
        preflightCommitment: "processed",
      });

      return tx;
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's an Anchor error with logs
        if ("logs" in error && Array.isArray(error.logs)) {
          // Look for specific program logs
          const programLogs = error.logs.filter(
            (log) =>
              log.includes("Program log:") ||
              log.includes(
                "Program 9ne8yuuK419t5VCHFojGUftW1ByUbafjbhq9Hq7JNkqG"
              )
          );

          if (programLogs.length > 0) {
            // Extract error code from logs if available
            const errorLog = programLogs.find((log) =>
              log.includes("Error Code:")
            );
            if (errorLog) {
              const match = errorLog.match(/Error Code: (\w+)/);
              const errorCode = match ? match[1] : "Unknown";
              throw new Error(`Program error (${errorCode}): ${error.message}`);
            }
          }

          // Check for specific error patterns
          const errorMessage = error.message.toLowerCase();

          if (
            errorMessage.includes("insufficient") ||
            errorMessage.includes("lamports")
          ) {
            throw new Error(
              "Insufficient funds. Please add more SOL to your wallet."
            );
          }

          if (errorMessage.includes("already exists")) {
            throw new Error(
              "A campaign with this title already exists. Please choose a different title."
            );
          }
        }
      }

      throw error;
    }
  };

  const fundCampaign = async (campaignPda: PublicKey, amount: number) => {
    if (!program || !wallet.publicKey) {
      throw new Error("Program or wallet not available");
    }

    const amountLamports = new BN(amount * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .fundCampaign(amountLamports)
      .accounts({
        campaign: campaignPda,
        funder: wallet.publicKey,
        system_program: SystemProgram.programId,
      })
      .rpc({
        commitment: "confirmed",
      });

    return tx;
  };

  const withdrawFunds = async (campaignPda: PublicKey) => {
    if (!program || !wallet.publicKey) {
      throw new Error("Program or wallet not available");
    }

    const tx = await program.methods
      .withdrawFunds()
      .accounts({
        campaign: campaignPda,
        creator: wallet.publicKey,
      })
      .rpc({
        commitment: "confirmed",
      });

    return tx;
  };

  const refundContribution = async (
    campaignPda: PublicKey,
    contributor: PublicKey
  ) => {
    if (!program || !wallet.publicKey) {
      throw new Error("Program or wallet not available");
    }

    const tx = await program.methods
      .refundContribution()
      .accounts({
        campaign: campaignPda,
        contributor,
        authority: wallet.publicKey,
      })
      .rpc({
        commitment: "confirmed",
      });

    return tx;
  };

  const getCampaign = async (campaignPda: PublicKey) => {
    if (!program) {
      throw new Error("Program not available");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const campaign = await (program.account as any).campaign.fetch(campaignPda);
    return { publicKey: campaignPda, account: campaign };
  };

  const getAllCampaigns = async () => {
    if (!program) {
      throw new Error("Program not available");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const campaigns = await (program.account as any).campaign.all();
      return campaigns;
    } catch {
      return [];
    }
  };

  return {
    createCampaign,
    fundCampaign,
    withdrawFunds,
    refundContribution,
    getCampaign,
    getAllCampaigns,
  };
};
