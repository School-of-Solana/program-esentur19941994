import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

export interface Campaign {
  creator: PublicKey;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number;
  createdAt: number;
  isActive: boolean;
}

export interface Contribution {
  contributor: PublicKey;
  campaign: PublicKey;
  amount: number;
  timestamp: number;
}

export interface CrowdfundingProgram extends Program {
  // Program methods will be auto-generated from IDL
}
