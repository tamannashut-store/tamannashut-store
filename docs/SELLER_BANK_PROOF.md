# Private seller bank proof

Seller applications now require one PDF, JPEG or PNG (maximum 3 MB). The document must show the account holder, account number and IFSC. Applicants can redact balances and unrelated transactions.

Documents use the existing SELLER_DATA_ENCRYPTION_KEY and AES-256-GCM storage in SellerProfile. The encrypted payload is excluded from ordinary database queries. No public image host, third-party verification provider or transfer is used. Authenticated document downloads use attachment disposition and no-store caching.

The seller can download their own document and replace it from Business profile. The platform administrator can download proof from Seller team. Replacement returns the seller to pending review and holds listings and payouts. New approvals require the current document digest and confirmation of the bank and GST checks; concurrent document replacement prevents stale approval through optimistic concurrency.

Existing marketplace sellers must upload proof immediately. On backend startup, active sellers without proof return to pending access and their listings are held. They can still sign in to Business profile to upload. Selling and payouts resume after owner review. Platform administrators are excluded. This checks submitted evidence; it does not establish bank-account activity through a banking network.

Deploy the backend and frontend together. An old frontend cannot submit new applications without the required multipart proof. No new provider credentials are needed; the existing seller-data encryption key must remain stable and backed up.
