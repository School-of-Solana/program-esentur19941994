use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("FKcv5xRMK7eF3uZx5YTVchMPoGsWhcxvdjE61t8RSNew");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String,
        description: String,
        target_amount: u64,
        deadline: i64,
    ) -> Result<()> {
        instructions::create_campaign::create_campaign(
            ctx,
            title,
            description,
            target_amount,
            deadline,
        )
    }

    pub fn fund_campaign(ctx: Context<FundCampaign>, amount: u64) -> Result<()> {
        instructions::fund_campaign::fund_campaign(ctx, amount)
    }

    pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
        instructions::withdraw_funds::withdraw_funds(ctx)
    }

    pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
        instructions::refund_contribution::refund_contribution(ctx)
    }
}
