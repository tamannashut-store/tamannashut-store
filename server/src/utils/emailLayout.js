import { escapeHtml } from "./html.js";

const siteUrl = process.env.CLIENT_URL || "https://www.tamannashut.com";

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const emailButton = (label, href) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td style="border-radius:12px;background:#285f3d"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 22px;color:#fff;text-decoration:none;font-size:15px;font-weight:700">${escapeHtml(label)}</a></td></tr></table>`;

export const emailLayout = ({ preheader = "An update from Tamanna's Hut", eyebrow = "TAMANNA'S HUT", title, body }) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f7f5ef;color:#172033;font-family:Arial,Helvetica,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f5ef;padding:28px 12px">
    <tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;overflow:hidden;border:1px solid #dfe6e1;border-radius:22px;background:#fff">
      <tr><td style="background:#123b29;padding:24px 30px;color:#fff"><div style="font-family:Georgia,serif;font-size:26px">Tamanna's Hut</div><div style="margin-top:5px;color:#c9d8ce;font-size:11px;letter-spacing:2px">HUT OF PURITY</div></td></tr>
      <tr><td style="padding:32px 30px 16px"><div style="color:#397153;font-size:11px;font-weight:700;letter-spacing:2px">${escapeHtml(eyebrow)}</div><h1 style="margin:10px 0 0;color:#172033;font-family:Georgia,serif;font-size:30px;line-height:1.2">${escapeHtml(title)}</h1></td></tr>
      <tr><td style="padding:0 30px 32px;color:#475569;font-size:15px;line-height:1.65">${body}</td></tr>
      <tr><td style="border-top:1px solid #e5e7eb;background:#fbfaf7;padding:22px 30px;color:#64748b;font-size:12px;line-height:1.6">Need help? Email <a href="mailto:support@tamannashut.com" style="color:#285f3d;font-weight:700">support@tamannashut.com</a><br><a href="${siteUrl}" style="color:#285f3d;text-decoration:none">www.tamannashut.com</a></td></tr>
    </table></td></tr>
  </table>
</body></html>`;

export const detailBox = (content) => `<div style="margin:20px 0;padding:18px;border:1px solid #dfe6e1;border-radius:14px;background:#f5f8f6">${content}</div>`;
