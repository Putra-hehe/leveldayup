const DOM_RACE_PATTERNS = [/removeChild/i, /insertBefore/i];

function readMessage(input: unknown): string {
  if (!input) return "";
  if (typeof input === "string") return input;
  if (typeof input === "object") {
    const maybeMessage = (input as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return "";
}

export function isKnownDomRaceError(input: unknown): boolean {
  const message = readMessage(input);
  return DOM_RACE_PATTERNS.some((pattern) => pattern.test(message));
}

let installed = false;

export function installDOMGuards() {
  if (installed || typeof window === "undefined" || typeof Node === "undefined") return;
  installed = true;

  const nodeProto = Node.prototype as Node & {
    __leveldayRemoveChildPatched?: boolean;
    __leveldayInsertBeforePatched?: boolean;
  };

  if (!nodeProto.__leveldayRemoveChildPatched) {
    const originalRemoveChild = Node.prototype.removeChild;

    Node.prototype.removeChild = function removeChildPatched<T extends Node>(child: T): T {
      if (!child || child.parentNode !== this) {
        return child;
      }

      try {
        return originalRemoveChild.call(this, child) as T;
      } catch (error) {
        if (isKnownDomRaceError(error)) {
          return child;
        }
        throw error;
      }
    };

    nodeProto.__leveldayRemoveChildPatched = true;
  }

  if (!nodeProto.__leveldayInsertBeforePatched) {
    const originalInsertBefore = Node.prototype.insertBefore;

    Node.prototype.insertBefore = function insertBeforePatched<T extends Node>(newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        return this.appendChild(newNode) as T;
      }

      try {
        return originalInsertBefore.call(this, newNode, referenceNode) as T;
      } catch (error) {
        if (isKnownDomRaceError(error)) {
          return this.appendChild(newNode) as T;
        }
        throw error;
      }
    };

    nodeProto.__leveldayInsertBeforePatched = true;
  }

  window.addEventListener(
    "error",
    (event) => {
      if (!isKnownDomRaceError(event.error ?? event.message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (!isKnownDomRaceError(event.reason)) return;
    event.preventDefault();
  });
}
