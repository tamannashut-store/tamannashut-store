// An owner-issued exception is scoped to this existing account, never inferred
// from a submitted email, GSTIN or client-supplied checkout state.
import { sellerProfileCompleteness } from "./sellerOnboarding.js";
export const ENROLMENT_SELLER_ID = "6ad310f1a547785020f5a253";
export const isEnrolmentSeller = (profile) => String(profile?.userId || "") === ENROLMENT_SELLER_ID
  && profile?.enrolment?.enabled === true;

export const enrolmentTradingApproved = (profile) => isEnrolmentSeller(profile)
  && sellerProfileCompleteness(profile).missingFields.every((field) => field === "GSTIN")
  && Boolean(profile.enrolment.numberEncrypted && profile.enrolment.reviewedBy && profile.enrolment.reviewedAt)
  && profile.enrolment.eligibilityConfirmed === true
  && profile.enrolment.state === "West Bengal"
  && profile.registeredAddress?.state === "West Bengal"
  && profile.pickupAddress?.state === "West Bengal"
  && profile.bankVerification?.status === "verified"
  && Boolean(profile.bankProof?.digest && profile.bankProof?.uploadedAt)
  && profile.verificationStatus === "pending"
  && profile.closure?.status !== "closed";

export const assertEnrolmentDestination = (profile, verifiedState) => {
  if (!isEnrolmentSeller(profile)) return;
  if (!enrolmentTradingApproved(profile)) throw Object.assign(new Error("Seller enrolment approval is pending"), { status: 409 });
  if (String(verifiedState || "").trim().toLowerCase() !== "west bengal") {
    throw Object.assign(new Error("Kismat Collection currently delivers within West Bengal only. Remove its items or choose an eligible delivery address"), { status: 400 });
  }
};
