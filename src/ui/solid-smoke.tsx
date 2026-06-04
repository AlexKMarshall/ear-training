import { render } from "solid-js/web";

/** Test-only harness; removed when home migrates to Solid (issue #81). */
export function SolidSmoke() {
  return <p role="status">Solid toolchain ready</p>;
}

export function mountSolidSmoke(root: HTMLElement): void {
  render(() => <SolidSmoke />, root);
}
