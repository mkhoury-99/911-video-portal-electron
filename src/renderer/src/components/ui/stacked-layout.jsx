"use client";

import * as Headless from "@headlessui/react";
import React, { useState } from "react";
import { NavbarItem } from "./navbar";

function OpenMenuIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className="size-5 shrink-0"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function MobileSidebar({ open, close, children }) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed left-0 inset-y-0 w-full max-w-80 p-2 transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-white shadow-xs ring-1 ring-zinc-950/5">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-100">
            <span className="text-sm font-medium text-zinc-700">
              Navigation
            </span>
            <Headless.CloseButton
              as={NavbarItem}
              aria-label="Close menu"
              className="p-2 rounded-lg hover:bg-zinc-100 -m-2"
            >
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  );
}

export function StackedLayout({ navbar, sidebar, children }) {
  let [showSidebar, setShowSidebar] = useState(false);
  const closeMobileSidebar = () => setShowSidebar(false);
  const sidebarContent =
    typeof sidebar === "function" ? sidebar(closeMobileSidebar) : sidebar;

  return (
    <div className="relative isolate flex min-h-svh w-full flex-col bg-zinc-100 lg:flex-row pt-2">
      {/* Sidebar on desktop - fixed left */}
      <div className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-10 lg:bg-white lg:border-r lg:border-zinc-200">
        {sidebarContent}
      </div>

      {/* Sidebar on mobile */}
      <MobileSidebar open={showSidebar} close={closeMobileSidebar}>
        {sidebarContent}
      </MobileSidebar>

      {/* Main content area */}
      <div className="flex flex-col flex-1 lg:pl-64">
        {/* Navbar */}
        <header className="flex items-center justify-between gap-4 lg:pl-4 pr-2">
          <div className="min-w-0 flex-1">{navbar}</div>
          <div className="py-2.5 lg:hidden shrink-0">
            <NavbarItem
              onClick={() => setShowSidebar(true)}
              aria-label="Open menu"
              className="flex items-center gap-2 px-1 rounded-lg bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50"
            >
              <OpenMenuIcon />
            </NavbarItem>
          </div>
        </header>

        {/* Content */}
        <main className="flex flex-1 flex-col pb-2 lg:px-2">
          <div className="grow p-3 rounded-lg bg-white lg:p-6 shadow-xs ring-1 ring-zinc-950/5">
            <div className="mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
