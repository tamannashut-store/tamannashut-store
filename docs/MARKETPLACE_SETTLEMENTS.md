# Marketplace settlement ledger

The settlement ledger separates each marketplace seller's order lines and
records discounts, commission, refunds, adjustments and payout references.
It does not initiate a bank transfer.

## Commission setting

The default marketplace commission is `0%`. Before charging a fee, agree the
commercial and tax treatment with every seller and set this server variable:

```text
MARKETPLACE_COMMISSION_PERCENT=0
MARKETPLACE_SETTLEMENT_HOLD_DAYS=7
```

The percentage is snapshotted when a settlement is first created. Changing the
environment variable does not rewrite historical settlement percentages.

## Lifecycle

- New order: `pending`
- Delivered order: `pending` during the configured return-window hold, then `eligible`
- Return, refund or RTO in progress: `held`
- Cancelled, refunded or RTO-delivered order: `reversed`
- Completed transfer recorded by an administrator: `paid`

An administrator may add an explained positive or negative adjustment, place a
record on manual hold, release it, and record a payout method and bank reference.
Paid records cannot be edited. If a paid order is later refunded, its ledger
becomes reversed while retaining the original transfer reference for audit.

## Fulfilment boundary

New orders also snapshot one fulfilment record per seller, including that
seller's pickup address and item SKUs. Shipping remains platform-managed until
separate Shiprocket pickup locations and shipment creation are enabled for each
verified seller. Do not allow sellers to create labels using another seller's
pickup address.
