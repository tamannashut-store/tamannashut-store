export default function ReturnShipmentControls({ order, busy, couriers, parcel, action }) {
  const request = order.returnRequest || {};
  const active = order.status === "Return Approved";
  const syncing = ["creating", "reconcile"].includes(request.reverseCreationStatus);
  const packageDetails = request.reversePackage?.weight ? request.reversePackage : parcel;
  const run = (name, body, message, prompt) => action(order, `return/${name}`, body, message, prompt);
  return <section className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
    <p className="font-semibold">Return shipment & pickup</p>
    <p className="mt-1 text-xs text-slate-500">Create or sync the return, assign a courier, then schedule collection from the customer.</p>
    {request.reverseCreationError && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{request.reverseCreationError}</p>}
    {request.reverseShipmentId ? <>
      <p className="mt-3 break-all font-mono text-xs">Shipment {request.reverseShipmentId}</p>
      {request.reverseAwb ? <>
        <p className="mt-1 break-all font-mono text-xs">AWB {request.reverseAwb}</p>
        {request.reverseCourierName && <p className="mt-1 text-sm">{request.reverseCourierName}</p>}
        {request.reversePickupScheduled ? <p className="mt-3 rounded-lg bg-white p-2 text-xs font-semibold text-cyan-800">Reverse pickup scheduled</p> : active && <button disabled={busy} onClick={() => run("pickup", {}, "Reverse pickup scheduled", "Schedule return pickup from the customer's address?")} className="btn-primary mt-3 w-full disabled:opacity-60">Schedule reverse pickup</button>}
      </> : active && <>
        <button disabled={busy} onClick={() => run("couriers", packageDetails, "Return couriers loaded")} className="btn-secondary mt-3 w-full disabled:opacity-60">Find return couriers</button>
        {couriers?.length === 0 && <p className="mt-2 text-sm text-slate-500">No return couriers are available for this package and pincode.</p>}
        {couriers?.map((courier) => <button key={courier.courier_company_id} disabled={busy} className="mt-2 w-full rounded-lg border bg-white p-3 text-left text-sm disabled:opacity-60" onClick={() => run("awb", { courierId: courier.courier_company_id, courierName: courier.courier_name }, "Return courier assigned", `Assign ${courier.courier_name} to collect this return?`)}><span className="block font-semibold">{courier.courier_name}</span><span>{Number.isFinite(Number(courier.rate)) ? `₹${Number(courier.rate).toFixed(2)}` : "Rate unavailable"} · Assign return courier</span></button>)}
      </>}
    </> : active && <button disabled={busy} onClick={() => run("create", parcel, syncing ? "Return shipment synced" : "Return shipment ready", syncing ? "Check Shiprocket and sync the existing return?" : "Create or recover the return shipment in Shiprocket using these package dimensions?")} className="btn-secondary mt-3 w-full disabled:opacity-60">{busy ? "Please wait…" : syncing ? "Sync existing return" : "Create reverse shipment"}</button>}
  </section>;
}
