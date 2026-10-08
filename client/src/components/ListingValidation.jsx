export function FieldError({ name, message }) {
  return message ? <span id={`listing-${name}-error`} className="mt-1.5 block text-sm text-red-700">{message}</span> : null;
}

export default function ListingValidation({ messages }) {
  return messages.length ? <div role="alert" className="mx-auto mb-5 max-w-5xl rounded-xl border border-red-200 bg-red-50 p-4"><p className="font-semibold text-red-900">Please correct these listing details</p><ul className="mt-2 space-y-1 text-sm text-red-800">{messages.map((message) => <li key={message}>{message}</li>)}</ul><p className="mt-3 text-xs text-red-800">Your entries are preserved. You can save a private draft and finish later.</p></div> : null;
}
