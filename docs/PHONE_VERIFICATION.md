# Customer phone verification and WELCOME10

The storefront grants an automatic 10% first-order discount only when the customer phone is verified and matches the checkout phone. It cannot be combined with a coupon. Eligibility is checked against both account order history and historical orders using that phone; a unique hashed claim on the order prevents concurrent reuse.

Phone verification uses Twilio Verify. Configure these Render environment variables:

- `TWILIO_SID`
- `TWILIO_AUTH`
- `TWILIO_VERIFY_SERVICE_SID`

Create the Verify Service in Twilio Console under **Verify > Services** and copy its Service SID. A Twilio trial can send only to recipient numbers permitted by the trial account, so public production verification requires upgrading Twilio or replacing the provider implementation in `server/src/services/phoneVerificationService.js`.

Do not add secrets to source control. Customers can order without verification; only the WELCOME10 promotion is withheld until verification succeeds.

## Mobile sign-in

Customer login now offers **Mobile & OTP** as well as email/password. Existing customers must first sign in with email, then verify their mobile number in Profile. This prevents an unverified delivery number from granting account access. New customers still register using email.

Mobile login uses the same Twilio Verify configuration. The login challenge expires after ten minutes, allows five code checks, and can be used only once. Resending is limited to once per minute. Seller Centre authentication remains separate.
