export function toast(message, timeout=3200) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  stack.appendChild(node);
  window.setTimeout(() => node.remove(), timeout);
}
