use anchor_lang::prelude::*;
use crate::state::Campaign;
use crate::errors::ErrorCode;

pub fn withdraw_funds(ctx: Context<WithdrawFunds>) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let creator = &ctx.accounts.creator;
    let clock = Clock::get()?;

    // Validate withdrawal conditions
    require!(campaign.creator == creator.key(), ErrorCode::UnauthorizedWithdrawal);
    require!(campaign.is_active, ErrorCode::CampaignNotActive);
    require!(
        campaign.current_amount >= campaign.target_amount || clock.unix_timestamp >= campaign.deadline,
        ErrorCode::WithdrawalNotAllowed
    );

    // Calculate withdrawal amount
    let withdrawal_amount = campaign.current_amount;
    
    // Transfer funds to creator
    **campaign.to_account_info().try_borrow_mut_lamports()? -= withdrawal_amount;
    **creator.to_account_info().try_borrow_mut_lamports()? += withdrawal_amount;

    // Mark campaign as inactive
    campaign.current_amount = 0;
    campaign.is_active = false;

    msg!("Creator withdrew {} lamports", withdrawal_amount);
    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
}
