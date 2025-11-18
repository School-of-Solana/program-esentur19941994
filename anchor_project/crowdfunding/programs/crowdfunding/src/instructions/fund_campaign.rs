use anchor_lang::prelude::*;
use crate::state::{Campaign, Contribution};
use crate::errors::ErrorCode;

pub fn fund_campaign(ctx: Context<FundCampaign>, amount: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let contributor = &ctx.accounts.contributor;
    let contribution = &mut ctx.accounts.contribution;
    let clock = Clock::get()?;

    // Validate campaign is active and not expired
    require!(campaign.is_active, ErrorCode::CampaignNotActive);
    require!(clock.unix_timestamp < campaign.deadline, ErrorCode::CampaignExpired);
    require!(amount > 0, ErrorCode::InvalidAmount);

    // Transfer SOL from contributor to campaign
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: contributor.to_account_info(),
        to: campaign.to_account_info(),
    };
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        cpi_accounts,
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Update campaign and contribution records
    campaign.current_amount += amount;
    contribution.contributor = contributor.key();
    contribution.campaign = campaign.key();
    contribution.amount = amount;
    contribution.timestamp = clock.unix_timestamp;

    msg!("Contribution of {} lamports received from {}", amount, contributor.key());
    Ok(())
}

#[derive(Accounts)]
pub struct FundCampaign<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(
        init,
        payer = contributor,
        space = Contribution::SPACE,
        seeds = [b"contribution", campaign.key().as_ref(), contributor.key().as_ref()],
        bump
    )]
    pub contribution: Account<'info, Contribution>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}
