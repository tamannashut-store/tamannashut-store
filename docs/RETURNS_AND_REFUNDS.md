# Return pickup and customer refunds

In Seller Centre > Orders, open the customer order and review its return reason and evidence.

1. Approve the return by moving **Return Requested** to **Return Approved**.
2. Review parcel weight and dimensions, then choose **Create reverse shipment**. The website first checks Shiprocket for an existing return using this order's reference. An uncertain creation is blocked from creating another return; use **Sync existing return** to reconcile it.
3. Choose **Find return couriers**, select a courier to assign the return AWB, then **Schedule reverse pickup**. A failed pickup does not mean shipment creation failed.
4. Track collection and receipt. Mark **Return Picked Up**, then **Returned** once received and inspected. Courier events can also update these statuses.
5. Process the customer refund as appropriate below.

## Online payments

For a paid online order in **Returned**, enter the refund amount and reason and choose **Refund through Razorpay**. The refund goes through Razorpay to the original payment source. This is a real payment action; confirm only after checking the amount. Pending refunds remain **Refund Pending** until Razorpay confirms processing through the configured webhook. Keep the Razorpay refund reference for support.

## Cash on delivery

When a collected COD order is moved to **Refund Pending**, the website automatically requests payment details by email and shows a persistent customer-account notification. The email links to a signed-in form in **My orders**. Customers choose UPI or bank transfer and can correct their details while the refund is pending. Submission clears the actionable notification. Online-paid orders never need this form.

The administrator can open **View customer refund details** from the order, make the payment externally, then record the transaction. If email delivery fails, the account notification remains available and **Retry request email** can retry the failed send without duplicating successful emails. Raw details are encrypted and excluded from normal order responses, emails, and seller views.

Configure `REFUND_DATA_ENCRYPTION_KEY` as a stable secret of at least 32 characters. If omitted, the existing `SELLER_DATA_ENCRYPTION_KEY` is used with a separate encryption context. Keep the key stable to retain access to stored details. The form fails safely if neither key is configured.

For a collected COD order, move **Returned** to **Refund Pending**. Pay the customer outside the website using UPI, bank transfer, cash, or another agreed method. Then select the method, enter the amount and transaction reference, and choose **Record COD refund**. This button records a payment you already made; it does not transfer money. Cash does not require a transaction reference. Uncollected COD orders do not require a refund.

## An existing return does not sync

Do not create another return manually for the same order. Check Shiprocket's Returns dashboard for reference `R` followed by the last 20 characters of the website order ID. The API account must be able to list returns. If Shiprocket accepted a request but has not exposed its shipment details yet, retry sync later. A request with an uncertain outcome stays blocked from automatic recreation to avoid duplicates.
