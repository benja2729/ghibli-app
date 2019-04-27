
export function dispatchAction(host, name, detail, options = {}) {
  const action = new CustomEvent(name, {
    bubbles: true,
    composed: true,
    cancelable: true,
    ...options,
    detail
  });
  host.dispatchEvent(action);
}

