export function createListenerRegistration(register) {
  let closed = false;
  let removeListener;

  return {
    async open() {
      const remove = await register();
      if (closed) {
        remove?.();
        return;
      }
      removeListener = remove;
    },
    close() {
      closed = true;
      removeListener?.();
      removeListener = undefined;
    },
  };
}
