use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Title is too long")]
    TitleTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Invalid target amount")]
    InvalidTargetAmount,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Campaign is not active")]
    CampaignNotActive,
    #[msg("Campaign has expired")]
    CampaignExpired,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Unauthorized withdrawal")]
    UnauthorizedWithdrawal,
    #[msg("Withdrawal not allowed")]
    WithdrawalNotAllowed,
    #[msg("Refund not allowed")]
    RefundNotAllowed,
    #[msg("Unauthorized refund")]
    UnauthorizedRefund,
}
