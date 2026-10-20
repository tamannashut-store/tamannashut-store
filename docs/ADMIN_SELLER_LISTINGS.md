# Administrator-managed seller listings

Administrators stay signed into their own account. **Products → Add product → Listing seller**
selects an eligible seller storefront for a new listing. No seller password, OTP, impersonation
session or authentication change is needed. Seller-originated create requests cannot set sellerId.

For an existing wrongly assigned private draft, open **Edit → Listing seller**, select the correct
seller, enter a reason and use **Assign draft and record audit**. The product stays a draft and
enters existing administrator approval. Prices, variants, media and SKU are not changed. Existing
order or review history, published/archived status, invalid/inactive/unverified targets and seller
callers all block reassignment. This is not a facility to transfer an established product business.

Only public storefront identity and delivery restrictions are returned by seller-choices, never
seller KYC/bank details. Eligibility reuses publicSellerStore, including the approved enrolment
exception. Kismat Collection's West Bengal restriction and settlement hold are unchanged; ownership
links the listing to those existing checks. Target credentials, account roles and authentication
methods are not touched.

Each delegated create or draft ownership update and its AuditLog record commit in the same MongoDB
transaction. Audit failure rolls the product operation back. Records contain administrator actor,
product, previous/new seller IDs, storefront and reason. The existing Operations audit feed shows
these records. Ordinary edits do not accept sellerId; changing ownership uses the dedicated guarded
endpoint. For assignment, persisted private status is checked on the server inside the transaction.
