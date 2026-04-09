use anchor_lang::prelude::*;
use anchor_lang::system_program;

// Replace with your actual deployed program ID later
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod xeris_crash {
    use super::*;

    // 1. Setup the Casino's Central Liquidity Vault
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.total_locked = 0;
        Ok(())
    }

    // 2. Player locks XRS into the vault for the current round
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_context, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_locked += amount;
        
        Ok(())
    }

    // 3. Backend Oracle pays out winners and absorbs losses
    pub fn resolve_bet(ctx: Context<ResolveBet>, payout_amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // If the player won, transfer winnings from the vault back to the player
        if payout_amount > 0 {
            **vault.to_account_info().try_borrow_mut_lamports()? -= payout_amount;
            **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += payout_amount;
        }
        
        // Deduct the original bet lock from the tracker
        vault.total_locked = vault.total_locked.saturating_sub(payout_amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: Account<'info, VaultState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveBet<'info> {
    #[account(mut)]
    pub oracle: Signer<'info>, // Must be your secure Python backend's wallet
    /// CHECK: The player receiving the funds
    #[account(mut)]
    pub player: AccountInfo<'info>,
    #[account(mut, seeds = [b"vault"], bump, has_one = authority @ CrashError::UnauthorizedOracle)]
    pub vault: Account<'info, VaultState>,
    /// CHECK: Authority check
    pub authority: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_locked: u64,
}

#[error_code]
pub enum CrashError {
    #[msg("Only the official server backend can resolve bets.")]
    UnauthorizedOracle,
}
