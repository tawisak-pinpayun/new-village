# Festival economy plan

Festival Token and Festival EXP are proposed currencies; they are not yet present in player saves. Do not accept a client-submitted score, token total or purchase price as authoritative.

Use MongoDB collections for mini-game sessions, validated scores, reward claims and purchases. Unique keys should include account ID, occurrence ID and game or shop item ID as appropriate. A reward claim must atomically check eligibility, mark the key claimed and update the account's festival balance. A shop purchase must atomically check current stock, balance and per-account limit. The existing account save revision API continues to own ordinary inventory and Coins. The proposed auction rewards must not grant ownership of auction lots.
