# Festival economy plan

Festival Token, Festival EXP and Friendship EXP now have account-scoped balances in `festival_progress`, separate from player saves. The Flower Festival grants Festival Token and Festival EXP; Friendship Day grants Friendship EXP. Client-submitted scores and balances are never authoritative.

`flower_sessions` and `gift_sessions` record server-issued seeds and deadlines. `festival_progress` stores balances and a claim keyed by yearly occurrence in one MongoDB document, so the claim check and balance increase use a single conditional update. Future festival shops must atomically check current stock, balance and per-account limits. The existing account save revision API continues to own ordinary inventory and Coins. Auction rewards must not grant ownership of auction lots.
