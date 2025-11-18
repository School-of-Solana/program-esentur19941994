import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useCrowdfunding } from "@/hooks/useCrowdfunding";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Wallet,
  Target,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface CampaignData {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    title: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    deadline: number;
    createdAt: number;
    isActive: boolean;
  };
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export const Dashboard: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const { createCampaign, fundCampaign, getAllCampaigns, withdrawFunds } =
    useCrowdfunding();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create campaign form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Fund campaign state
  const [fundingAmounts, setFundingAmounts] = useState<{
    [key: string]: string;
  }>({});

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Toast helper functions
  const showToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const campaignData = await getAllCampaigns();
      setCampaigns(campaignData as CampaignData[]);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [getAllCampaigns]);

  useEffect(() => {
    if (connected && campaigns.length === 0) {
      loadCampaigns();
    }
  }, [connected, campaigns.length, loadCampaigns]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !targetAmount || !deadline) return;

    setLoading(true);
    try {
      const deadlineDate = new Date(deadline);
      const targetAmountSol = parseFloat(targetAmount); // Keep in SOL, let useCrowdfunding convert

      await createCampaign(title, description, targetAmountSol, deadlineDate);

      showToast(`Campaign "${title}" created successfully!`, "success");

      // Reset form
      setTitle("");
      setDescription("");
      setTargetAmount("");
      setDeadline("");
      setShowCreateForm(false);

      // Reload campaigns
      await loadCampaigns();
    } catch (error) {
      console.error("Error creating campaign:", error);
      showToast(
        `Error creating campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFundCampaign = async (
    campaignPda: PublicKey,
    campaignKey: string
  ) => {
    const amount = fundingAmounts[campaignKey];
    if (!amount) return;

    setLoading(true);
    try {
      const amountSol = parseFloat(amount); // Keep in SOL, let useCrowdfunding convert
      await fundCampaign(campaignPda, amountSol);

      showToast(
        `Successfully contributed ${amountSol} SOL to the campaign!`,
        "success"
      );

      // Reset funding amount
      setFundingAmounts({ ...fundingAmounts, [campaignKey]: "" });

      // Reload campaigns
      await loadCampaigns();
    } catch (error) {
      console.error("Error funding campaign:", error);
      showToast(
        `Error funding campaign: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (campaignPda: PublicKey) => {
    setLoading(true);
    try {
      await withdrawFunds(campaignPda);
      showToast("Funds withdrawn successfully!", "success");
      await loadCampaigns();
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      showToast(
        `Error withdrawing funds: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatSOL = (lamports: number) => {
    return (lamports / 1000000000).toFixed(4);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isExpired = (deadline: number) => {
    return Date.now() / 1000 > deadline;
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Solana FundMe
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Connect your wallet to start creating and funding campaigns on
                Solana
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !border-0 !rounded-lg !font-medium !px-8 !py-3" />
            <div className="text-xs text-muted-foreground text-center">
              Supported wallets: Phantom, Solflare, and more
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Solana FundMe
            </h1>
            <p className="text-lg text-muted-foreground">
              Create and fund decentralized campaigns on the Solana blockchain
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-mono">
                {publicKey?.toString().slice(0, 8)}...
                {publicKey?.toString().slice(-8)}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => loadCampaigns()}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
            <WalletMultiButton className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700 !border-0 !rounded-lg" />
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <Card className="mb-8 shadow-xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Plus className="h-4 w-4 text-white" />
                </div>
                Create New Campaign
              </CardTitle>
              <CardDescription className="text-base">
                Start your crowdfunding campaign on the Solana blockchain. Set
                your goals and let the community support your vision.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateCampaign}>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-base font-medium">
                    Campaign Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your campaign title..."
                    className="h-12 text-base"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Choose a clear, descriptive title for your campaign
                  </p>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-base font-medium"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your campaign, goals, and how funds will be used..."
                    className="min-h-[120px] text-base resize-none"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Explain your project and why people should support it
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="target"
                      className="text-base font-medium flex items-center gap-2"
                    >
                      <Target className="h-4 w-4" />
                      Target Amount (SOL)
                    </Label>
                    <Input
                      id="target"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      placeholder="10.0"
                      className="h-12 text-base"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      How much SOL do you need to raise?
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="deadline"
                      className="text-base font-medium flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Campaign Deadline
                    </Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      When should your campaign end?
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg h-12"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 h-12"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Campaigns Grid */}
        {loading && campaigns.length === 0 ? (
          <div className="text-center py-16">
            <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-xl font-medium text-muted-foreground">
              Loading campaigns...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Fetching data from the Solana blockchain
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Target className="h-12 w-12 text-white" />
            </div>
            <p className="text-xl font-medium text-muted-foreground mb-2">
              No campaigns found
            </p>
            <p className="text-sm text-muted-foreground">
              Create the first campaign and start your crowdfunding journey!
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Campaign
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
              <p className="text-muted-foreground">
                {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}{" "}
                found
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns
                .sort((a, b) => b.account.createdAt - a.account.createdAt) // Sort by creation date (newest first)
                .map((campaign) => {
                  const campaignKey = campaign.publicKey.toString();
                  const progress = getProgress(
                    campaign.account.currentAmount,
                    campaign.account.targetAmount
                  );
                  const expired = isExpired(campaign.account.deadline);
                  const isCreator =
                    campaign.account.creator.toString() ===
                    publicKey?.toString();

                  return (
                    <Card
                      key={campaignKey}
                      className="group flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden"
                    >
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4 z-10">
                        {expired ? (
                          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            Expired
                          </div>
                        ) : campaign.account.isActive ? (
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </div>
                        ) : (
                          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Inactive
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-4 pt-6">
                        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-200 pr-20">
                          {campaign.account.title}
                        </CardTitle>
                        <CardDescription className="text-base line-clamp-3 leading-relaxed">
                          {campaign.account.description}
                        </CardDescription>
                        {isCreator && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1 w-fit">
                            <User className="h-3 w-3" />
                            Your Campaign
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="flex-1 space-y-6">
                        {/* Enhanced Progress Bar */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-medium text-muted-foreground">
                              Funding Progress
                            </span>
                            <span className="text-lg font-bold text-foreground">
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            {progress >= 100 && (
                              <div className="absolute -top-1 -right-1">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Enhanced Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                Target
                              </span>
                            </div>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {formatSOL(campaign.account.targetAmount)} SOL
                            </p>
                          </div>

                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                Raised
                              </span>
                            </div>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">
                              {formatSOL(campaign.account.currentAmount)} SOL
                            </p>
                          </div>

                          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-orange-600" />
                              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                                Deadline
                              </span>
                            </div>
                            <p
                              className={`text-sm font-semibold ${
                                expired
                                  ? "text-red-600"
                                  : "text-orange-900 dark:text-orange-100"
                              }`}
                            >
                              {formatDate(campaign.account.deadline)}
                            </p>
                          </div>

                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                Status
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                              {campaign.account.isActive
                                ? "Active"
                                : "Inactive"}
                            </p>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-col gap-3 pt-6 bg-gray-50/50 dark:bg-slate-800/50">
                        {/* Fund Campaign */}
                        <div className="flex w-full gap-3">
                          <Input
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="Amount in SOL"
                            value={fundingAmounts[campaignKey] || ""}
                            onChange={(e) =>
                              setFundingAmounts({
                                ...fundingAmounts,
                                [campaignKey]: e.target.value,
                              })
                            }
                            disabled={expired || !campaign.account.isActive}
                            className="flex-1 h-11"
                          />
                          <Button
                            onClick={() =>
                              handleFundCampaign(
                                campaign.publicKey,
                                campaignKey
                              )
                            }
                            disabled={
                              loading ||
                              expired ||
                              !campaign.account.isActive ||
                              !fundingAmounts[campaignKey]
                            }
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 px-6 h-11"
                          >
                            Fund
                          </Button>
                        </div>

                        {/* Withdraw Button (only for campaign creator) */}
                        {isCreator && (
                          <Button
                            variant="outline"
                            className="w-full h-11 border-2 hover:bg-orange-50 hover:border-orange-300 dark:hover:bg-orange-900/20"
                            onClick={() => handleWithdraw(campaign.publicKey)}
                            disabled={loading}
                          >
                            {loading ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Wallet className="mr-2 h-4 w-4" />
                            )}
                            Withdraw Funds
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-500 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {toast.type === "success" && (
                  <CheckCircle className="h-5 w-5" />
                )}
                {toast.type === "error" && <XCircle className="h-5 w-5" />}
                {toast.type === "info" && <AlertCircle className="h-5 w-5" />}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-white hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
