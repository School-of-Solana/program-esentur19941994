use anchor_lang::prelude::*;

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub target_amount: u64,
    pub current_amount: u64,
    pub deadline: i64,
    pub created_at: i64,
    pub is_active: bool,
}

impl Campaign {
    pub fn space(title: &str) -> usize {
        8 + // discriminator
        32 + // creator
        4 + title.len() + // title
        4 + 500 + // description (max 500 chars)
        8 + // target_amount
        8 + // current_amount
        8 + // deadline
        8 + // created_at
        1 // is_active
    }
}

#[account]
pub struct Contribution {
    pub contributor: Pubkey,
    pub campaign: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

impl Contribution {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8;
}
