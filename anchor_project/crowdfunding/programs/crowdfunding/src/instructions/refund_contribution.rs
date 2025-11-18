use anchor_lang::prelude::*;
use crate::state::{Campaign, Contribution};
use crate::errors::ErrorCode;

pub fn refund_contribution(ctx: Context<RefundContribution>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let contribution = &ctx.accounts.contribution;
    let contributor = &ctx.accounts.contributor;
    let clock = Clock::get()?;

    // Validate refund conditions
    require!(
        clock.unix_timestamp >= campaign.deadline && campaign.current_amount < campaign.target_amount,
        ErrorCode::RefundNotAllowed
    );
    require!(contribution.contributor == contributor.key(), ErrorCode::UnauthorizedRefund);

    // Refund the contribution
    let refund_amount = contribution.amount;
    **campaign.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
    **contributor.to_account_info().try_borrow_mut_lamports()? += refund_amount;

    msg!("Refunded {} lamports to {}", refund_amount, contributor.key());
    Ok(())
}

#[derive(Accounts)]
pub struct RefundContribution<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut, close = contributor)]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
}
