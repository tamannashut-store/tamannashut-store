import twilio from "twilio";

const service = () => {
  const { TWILIO_SID, TWILIO_AUTH, TWILIO_VERIFY_SERVICE_SID } = process.env;
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_VERIFY_SERVICE_SID) {
    throw Object.assign(new Error("Phone verification is temporarily unavailable"), { status: 503 });
  }
  return twilio(TWILIO_SID, TWILIO_AUTH).verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
};

export const sendPhoneVerification = (phone) => service().verifications.create({ to: phone, channel: "sms" });
export const checkPhoneVerification = (phone, code) => service().verificationChecks.create({ to: phone, code });
export const phoneVerificationConfigured = () => Boolean(process.env.TWILIO_SID && process.env.TWILIO_AUTH && process.env.TWILIO_VERIFY_SERVICE_SID);
