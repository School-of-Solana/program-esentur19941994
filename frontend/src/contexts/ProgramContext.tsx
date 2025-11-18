import React, { createContext, useContext, useMemo } from "react";
import { Connection } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { IDL } from "@/idl/crowdfunding";
import { PROGRAM_ID } from "@/lib/constants";

interface ProgramContextType {
  program: Program<Idl> | null;
  connection: Connection;
}

const ProgramContext = createContext<ProgramContextType>({
  program: null,
  connection: new Connection("https://api.devnet.solana.com"),
});

export const useProgram = () => {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error("useProgram must be used within a ProgramProvider");
  }
  return context;
};

interface ProgramProviderProps {
  children: React.ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({
  children,
}) => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const program = useMemo(() => {
    if (!wallet.connected || !wallet.publicKey) {
      return null;
    }

    if (!wallet.signTransaction) {
      // Let's try without signTransaction check since some wallets might provide it differently
    }

    try {
      // Create a simpler wallet adapter
      const anchorWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction!,
        signAllTransactions: wallet.signAllTransactions!,
      };

      const provider = new AnchorProvider(connection, anchorWallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });

      // Verify that the IDL address matches our program ID
      if (IDL.address !== PROGRAM_ID.toString()) {
        console.error("IDL address mismatch!", {
          idlAddress: IDL.address,
          programId: PROGRAM_ID.toString(),
        });
      }

      // Create program with explicit casting to avoid type issues
      const idl = IDL as unknown as Idl;
      const programInstance = new Program(idl, provider);

      return programInstance;
    } catch (error) {
      console.error("Failed to create program:", error);
      return null;
    }
  }, [connection, wallet]);

  return (
    <ProgramContext.Provider value={{ program, connection }}>
      {children}
    </ProgramContext.Provider>
  );
};
