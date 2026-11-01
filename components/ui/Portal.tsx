"use client";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};

// Popup / modal ko <body> me dikhata hai. Page ka ".wrap" apna stacking context banata hai (z-index:1),
// isliye uske andar ka popup header aur bottom bar ke NEECHE dab jata tha. Server par kuch nahi dikhata.
export default function Portal({ children }: { children: ReactNode }) {
  const host = useSyncExternalStore(noop, () => document.body, () => null);
  return host ? createPortal(children, host) : null;
}
