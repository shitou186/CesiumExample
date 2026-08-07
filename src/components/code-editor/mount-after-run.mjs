export async function mountAfterRun(runExample, mountPanel) {
  await runExample();
  mountPanel();
}
