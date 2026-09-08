"use client";

export default function LegalFooter() {
  return (
    <footer className="w-full border-t border-[var(--border-color)] mt-8 pt-4 pb-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Gambling Awareness Banner */}
        <div className="flex items-center justify-center gap-4 mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <span className="text-2xl">🔞</span>
          <p className="text-xs text-yellow-400">
            <strong>18+</strong> — Gambling can be addictive. Please gamble responsibly.
            If you need help, visit{" "}
            <a
              href="https://www.begambleaware.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-300"
            >
              BeGambleAware.org
            </a>
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
          <a href="/dashboard/responsible-gambling" className="hover:text-green-400 transition-colors">
            🛡️ Responsible Gambling
          </a>
          <span>·</span>
          <a href="/terms" className="hover:text-green-400 transition-colors">
            Terms of Service
          </a>
          <span>·</span>
          <a href="/privacy" className="hover:text-green-400 transition-colors">
            Privacy Policy
          </a>
          <span>·</span>
          <a href="mailto:support@aifootball.com" className="hover:text-green-400 transition-colors">
            Contact Support
          </a>
        </div>

        {/* Copyright */}
        <p className="text-center text-[10px] text-[var(--text-secondary)] mt-3 opacity-60">
          © {new Date().getFullYear()} AI Football Dashboard. All rights reserved.
          Virtual match outcomes are determined by probability-based algorithms. Past performance does not guarantee future results.
        </p>
      </div>
    </footer>
  );
}
