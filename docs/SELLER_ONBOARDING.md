# Seller onboarding and verification

Seller applications are public at `/seller/register`, linked from the storefront
footer and Seller Centre sign-in. Applicants verify an email through customer
sign-in/signup first. Mobile-only customers can add a verified email on the
application page. An administrator may also send an optional invitation from
**Seller Centre → Seller team**, valid for 48 hours and usable once.

Existing customers retain their account ID and purchase history when applying.
Password accounts confirm their existing password; passwordless customers choose
a Seller Centre password. Submission revokes customer sessions and switches the
account to a pending seller. Subsequent sign-in uses Seller Centre password and
email security code. Application, account changes and invitation acceptance are
atomic, so failures do not partially convert or delete customer accounts.

## Required production setting

Add this server environment variable in Render before accepting seller
registrations:

```text
SELLER_DATA_ENCRYPTION_KEY=<a private random value of at least 32 characters>
```

Generate a 32-byte value in Windows PowerShell 5.1 or newer without sharing it
in chat or source control:

```powershell
$sellerKeyGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$sellerKeyBytes = New-Object byte[] 32
$sellerKeyGenerator.GetBytes($sellerKeyBytes)
$sellerKeyGenerator.Dispose()
([System.BitConverter]::ToString($sellerKeyBytes)).Replace("-", "")
```

Keep the value stable. Changing or losing it makes previously encrypted GST,
PAN and bank details unreadable. Never add it to Git.

## Verification workflow

1. The applicant opens the public application page or an emailed invitation.
2. The seller creates credentials and submits the legal business name, GSTIN,
   PAN, account-holder name, bank-account number and IFSC.
3. The server validates GSTIN/PAN consistency and identifier formats, then
   encrypts GST, PAN, bank-account and IFSC values with AES-256-GCM.
4. Seller Centre access remains locked while the submission is pending.
5. The owner opens **Seller team**, compares the GSTIN with the official GST
   taxpayer search, and compares the settlement details with bank proof.
6. The owner approves or rejects the seller with a review note. The seller is
   emailed the result; pending applicants can view their business profile, while only approved sellers can list products and manage sales.

Format validation is not government or bank verification. Do not approve an
account solely because the form accepted its identifiers. Automated GST lookup
or bank penny-drop verification requires an authorised provider and should be
implemented as a separate integration.

## Security notes

- Invitation tokens are stored only as SHA-256 hashes.
- Full sensitive identifiers are never written to audit logs.
- Only the store-owner account can load full verification details.
- The Operations page reports whether seller-data encryption is configured.
- Remove a seller's access immediately if their relationship with the store
  ends; suspension and credential-rotation controls are the next recommended
  administration upgrade.
