/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { PdfSigner } from './components/PdfSigner';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <PdfSigner />
      </main>
      <Footer />
    </div>
  );
}
