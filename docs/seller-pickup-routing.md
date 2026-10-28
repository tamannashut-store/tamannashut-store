# Seller pickup routing status

The current Shiprocket adapter creates one shipment for the whole order using
`SHIPROCKET_PICKUP_LOCATION` and `SHIPROCKET_PICKUP_POSTCODE`. It does not yet
support seller pickup mappings or splitting mixed orders.

## Interim behaviour

Orders with seller fulfilment snapshots, enrolment supplier details, or legacy
Kismat item ownership are blocked from automatic courier lookup and shipment
creation (including returns). The error instructs administrators to arrange
shipping manually from the correct verified seller pickup address.

The guard runs before a return creation attempt is claimed, preventing a local
configuration block from being mistaken for an uncertain provider response.
Existing shipment tracking remains available. Existing AWB and pickup actions
are unchanged because they act on a shipment already created in Shiprocket.

This is not a complete audit of older seller orders without fulfilment snapshots.
Administrators must check their origin before scheduling any existing shipment.

## Before automatic seller shipping can be enabled

1. Save an owner-controlled mapping from seller ID to the exact verified
   Shiprocket pickup location and postcode; never infer it from a display name.
2. Verify the provider location and compare its postcode to the order's saved
   seller pickup address. `planSellerPickup` validates the single-seller plan,
   but is deliberately not connected to provider calls yet.
3. Persist the chosen pickup location with the shipment so later mapping changes
   cannot silently reroute returns.
4. Split mixed-origin orders with separate totals, tracking, labels and returns.
5. Validate serviceability from each seller origin and exercise the complete
   shipment lifecycle in an approved test environment before enabling it.

No seller mapping or production environment configuration is changed by this fix.
