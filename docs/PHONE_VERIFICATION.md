# Customer phone verification and WELCOME10

The storefront grants an automatic 10% first-order discount only when the customer phone is verified and matches the checkout phone. It cannot be combined with a coupon. Eligibility is checked against both account order history and historical orders using that phone; a unique hashed claim on the order prevents concurrent reuse.

Phone verification uses Twilio Verify. Configure these Render environment variables:

- `TWILIO_SID`
- `TWILIO_AUTH`
- `TWILIO_VERIFY_SERVICE_SID`

Create the Verify Service in Twilio Console under **Verify > Services** and copy its Service SID. A Twilio trial can send only to recipient numbers permitted by the trial account, so public production verification requires upgrading Twilio or replacing the provider implementation in `server/src/services/phoneVerificationService.js`.

Do not add secrets to source control. Customers can order without verification; only the WELCOME10 promotion is withheld until verification succeeds.
