// VerifyPage.tsx
"use client";
import { Fragment, useState, Suspense } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import VerificationAspect from './verificationAspect'; // Make sure the path is correct

export default function VerifyPage() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    // Close the current browser tab
    // Implementation depends on your specific needs
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
        {/* ... Rest of the Dialog and Transition components ... */}
        <div className="fixed inset-0 z-10 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  Email Verification
                </Dialog.Title>
                <div className="mt-2">
                  <Suspense fallback={<p>Loading...</p>}>
                    <p className="text-sm text-gray-500">
                      <VerificationAspect />
                    </p>
                  </Suspense>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={handleClose}
                  >
                    ok cool !
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
