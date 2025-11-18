use anchor_lang::prelude::*;
use crate::state::Campaign;
use crate::errors::ErrorCode;

pub fn create_campaign(
    ctx: Context<CreateCampaign>,
    title: String,
    description: String,
    target_amount: u64,
    deadline: i64,
) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let creator = &ctx.accounts.creator;
    let clock = Clock::get()?;

    // Validate inputs
    require!(title.len() <= 100, ErrorCode::TitleTooLong);
    require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
    require!(target_amount > 0, ErrorCode::InvalidTargetAmount);
    require!(deadline > clock.unix_timestamp, ErrorCode::InvalidDeadline);

    campaign.creator = creator.key();
    campaign.title = title;
    campaign.description = description;
    campaign.target_amount = target_amount;
    campaign.current_amount = 0;
    campaign.deadline = deadline;
    campaign.created_at = clock.unix_timestamp;
    campaign.is_active = true;

    msg!("Campaign created: {}", campaign.title);
    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateCampaign<'info> {
    #[account(
        init,
        payer = creator,
        space = Campaign::space(&title),
        seeds = [b"campaign", creator.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}
