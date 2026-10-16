# Festival economy plan

Festival Token and Festival EXP now have an account-scoped balance in `festival_progress`, separate from player saves. The Flower Festival server route grants them after replay validation. Client-submitted scores and token totals are never authoritative.

`flower_sessions` records server-issued seeds and deadlines. `festival_progress` stores balances and a claim keyed by yearly occurrence in one MongoDB document, so the claim check and balance increase use a single conditional update. Future festival shops must atomically check current stock, balance and per-account limits. The existing account save revision API continues to own ordinary inventory and Coins. Auction rewards must not grant ownership of auction lots.
