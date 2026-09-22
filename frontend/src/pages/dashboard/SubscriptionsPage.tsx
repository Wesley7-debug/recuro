import { useEffect, useState, useRef, useCallback } from "react";
import {
  useSubscriptionStore,
  type Subscription,
} from "../../stores/subscriptionStore";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api/client";
import { formatCurrency } from "../../lib/utils";
import { fetchRates, convert } from "../../lib/exchangeRate";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import Modal from "../../components/Modal";
import FormField from "../../components/FormField";
import { CATEGORY_COLORS } from "../../components/CategoryBadge";
import { showToast } from "../../components/Toast";

const CATEGORIES = [
  "entertainment",
  "productivity",
  "fitness",
  "education",
  "finance",
  "social",
  "utilities",
  "other",
];
const CYCLES = ["weekly", "monthly", "quarterly", "yearly"];
const STATUSES = ["active", "cancelled", "paused"];

const emptyForm = {
  name: "",
  provider: "",
  category: "other",
  amount: "",
  currency: "USD",
  billingCycle: "monthly",
  nextBillingDate: "",
  status: "active",
};

type DetectedSub = {
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: string;
  occurrences: number;
  lastDate: string;
  confidence: number;
  status: "new" | "existing";
  classification:
    | "subscription_candidate"
    | "recurring_non_subscription"
    | "excluded";
  reasons: string[];
};

type UploadStep =
  | "idle"
  | "uploading"
  | "review"
  | "adding"
  | "done"
  | "failed";

export default function SubscriptionsPage() {
  const {
    subscriptions,
    loading,
    filters,
    setFilters,
    fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptionStore();
  const { user } = useAuth();
  const userCurrency = user?.preferred_currency || "NGN";

  // Form modal
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Add options modal
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadError, setUploadError] = useState("");
  const [detectedSubs, setDetectedSubs] = useState<DetectedSub[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [statementId, setStatementId] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchRates();
  }, []);

  const handleFile = async (file: File) => {
    setUploadError("");
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted.");
      setUploadStep("failed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10 MB.");
      setUploadStep("failed");
      return;
    }

    setUploadStep("uploading");
    try {
      const result = await api.statements.upload(file);
      setStatementId(result.id);

      if (result.status === "failed") {
        setUploadError(result.error || "Processing failed.");
        setUploadStep("failed");
        return;
      }

      const detected: DetectedSub[] = result.detected || [];
      const candidates = detected.filter(
        (d) => d.classification === "subscription_candidate",
      );
      setDetectedSubs(candidates);
      setSelectedIndices(new Set(candidates.map((_, i) => i)));
      setUploadStep("review");
    } catch (err: any) {
      setUploadError(err.message || "Upload failed.");
      setUploadStep("failed");
    }
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleUploadClick = () => {
    setShowAddOptions(false);
    setUploadStep("idle");
    setUploadError("");
    setDetectedSubs([]);
    setSelectedIndices(new Set());
    setStatementId(null);
    setAddedCount(0);
    setShowUploadModal(true);
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const toggleIndex = (i: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIndices.size === detectedSubs.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(detectedSubs.map((_, i) => i)));
    }
  };

  const handleBulkAdd = async () => {
    if (!statementId || selectedIndices.size === 0) return;
    setUploadStep("adding");
    try {
      const result = await api.statements.confirm(
        statementId,
        Array.from(selectedIndices),
      );
      setAddedCount(result.count);
      setUploadStep("done");
      fetchSubscriptions();

      // Show toasts
      if (result.added && result.added.length > 0) {
        for (const name of result.added) {
          showToast(`${name} subscription detected and added.`, "success");
        }
      }
      if (result.updated && result.updated.length > 0) {
        for (const name of result.updated) {
          showToast(
            `${name} is already in your subscriptions. Updated.`,
            "info",
          );
        }
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to add subscriptions.");
      setUploadStep("failed");
    }
  };

  const handleSkip = () => {
    setShowUploadModal(false);
    setUploadStep("idle");
    setDetectedSubs([]);
    setSelectedIndices(new Set());
  };

  const closeUploadModal = () => {
    if (uploadStep === "uploading" || uploadStep === "adding") return;
    setShowUploadModal(false);
    setUploadStep("idle");
    setDetectedSubs([]);
    setSelectedIndices(new Set());
    setUploadError("");
    setAddedCount(0);
  };

  const openAddOptions = () => setShowAddOptions(true);

  const openAddForm = () => {
    setForm({ ...emptyForm, currency: userCurrency });
    setEditingId(null);
    setFormError("");
    setShowAddOptions(false);
    setShowForm(true);
  };

  const openEdit = (s: Subscription) => {
    setForm({
      name: s.name,
      provider: s.provider,
      category: s.category,
      amount: String(s.amount),
      currency: s.currency,
      billingCycle: s.billingCycle,
      nextBillingDate: s.nextBillingDate.split("T")[0],
      status: s.status,
    });
    setEditingId(s._id);
    setFormError("");
    setShowForm(true);
  };

  const openDelete = (s: Subscription) => setDeleteTarget(s);
  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        provider: form.provider,
        category: form.category,
        amount: parseFloat(form.amount),
        currency: form.currency,
        billingCycle: form.billingCycle as Subscription["billingCycle"],
        nextBillingDate: form.nextBillingDate,
        status: form.status as Subscription["status"],
      };
      if (editingId) {
        await updateSubscription(editingId, payload);
      } else {
        await createSubscription(payload);
      }
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubscription(deleteTarget._id);
      closeDelete();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={onFileChange}
        className="hidden"
      />

      <PageHeader
        title="Subscriptions"
        subtitle={`${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}`}
        action={
          <button onClick={openAddOptions} className="ui-btn-primary">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add subscription
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-input-placeholder"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10 pr-4 py-2.5 border border-border-input bg-input-bg rounded-button text-[13px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_#primary-shadow] w-full placeholder:text-input-placeholder text-ink-body"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className="px-4 py-2.5 border border-border-input bg-input-bg rounded-button text-[13px] outline-none transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_#primary-shadow] appearance-none text-ink-body"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Add Options Modal ─────────────────────────────────── */}
      <Modal
        open={showAddOptions}
        onClose={() => setShowAddOptions(false)}
        title="Add subscription"
      >
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setShowAddOptions(false);
              setShowComingSoon(true);
            }}
            className="flex items-center gap-4 w-full p-4 rounded-card border border-border hover:border-border-hover hover:bg-surface-alt transition-all text-left group"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-badge bg-cat-productivity-bg text-cat-productivity-text">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink flex items-center gap-2">
                Connect bank
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-surface-alt text-ink-faint border border-border">
                  Coming soon
                </span>
              </p>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Automatically import transactions from your bank account
              </p>
            </div>
            <svg
              className="w-4 h-4 text-ink-ghost group-hover:text-ink-muted transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          <button
            onClick={handleUploadClick}
            className="flex items-center gap-4 w-full p-4 rounded-card border border-border hover:border-border-hover hover:bg-surface-alt transition-all text-left group"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-badge bg-cat-entertainment-bg text-cat-entertainment-text">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink">Upload PDF</p>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Upload a bank statement or receipt to extract subscriptions
              </p>
            </div>
            <svg
              className="w-4 h-4 text-ink-ghost group-hover:text-ink-muted transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          <button
            onClick={openAddForm}
            className="flex items-center gap-4 w-full p-4 rounded-card border border-border hover:border-border-hover hover:bg-surface-alt transition-all text-left group"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-badge bg-warm text-warm-dark">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-ink">Add manually</p>
              <p className="text-[12px] text-ink-muted mt-0.5">
                Enter your subscription details by hand
              </p>
            </div>
            <svg
              className="w-4 h-4 text-ink-ghost group-hover:text-ink-muted transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </Modal>

      {/* ── Coming Soon Modal ────────────────────────────────────── */}
      <Modal
        open={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="Connect your bank"
      >
        <div className="flex flex-col items-center py-4 gap-5">
          <div className="w-14 h-14 rounded-full bg-cat-productivity-bg flex items-center justify-center">
            <svg
              className="w-7 h-7 text-cat-productivity-text"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-[14px] font-semibold text-ink mb-1">
              Coming soon
            </p>
            <p className="text-[12px] text-ink-faint leading-relaxed max-w-[280px]">
              We're working on secure bank connections so Recuro can
              automatically monitor your transactions and detect recurring
              payments.
            </p>
          </div>
          <button
            onClick={() => setShowComingSoon(false)}
            className="ui-btn-secondary w-full"
          >
            Got it
          </button>
        </div>
      </Modal>

      {/* ── Upload Modal ──────────────────────────────────────── */}
      <Modal
        open={showUploadModal}
        onClose={closeUploadModal}
        title={
          uploadStep === "idle"
            ? "Upload statement"
            : uploadStep === "uploading"
              ? "Uploading..."
              : uploadStep === "review"
                ? "Subscriptions found"
                : uploadStep === "adding"
                  ? "Adding subscriptions..."
                  : uploadStep === "done"
                    ? "All done"
                    : "Upload failed"
        }
      >
        {/* Idle — show upload icon */}
        {uploadStep === "idle" && (
          <div className="flex flex-col items-center py-6 gap-5">
            <button
              onClick={handlePickFile}
              className="upload-zone__icon upload-zone__icon--large"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-ink mb-1">
                Select a PDF file
              </p>
              <p className="text-[12px] text-ink-faint">
                Click the icon above to browse your files
              </p>
              <p className="text-[11px] text-ink-ghost mt-2">
                PDF only · Max 10 MB
              </p>
            </div>
          </div>
        )}

        {/* Uploading */}
        {uploadStep === "uploading" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="ui-spinner" />
            <p className="text-[14px] text-ink text-center">
              Uploading and analyzing your statement...
            </p>
          </div>
        )}

        {/* Review — show detected subscriptions with checkboxes */}
        {uploadStep === "review" && (
          <div>
            {detectedSubs.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-cat-other-bg flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-ink-ghost"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-ink mb-1">
                  No subscriptions found
                </p>
                <p className="text-[12px] text-ink-faint">
                  We couldn't detect any likely subscriptions in this statement.
                </p>
                <button onClick={handleSkip} className="ui-btn-secondary mt-4">
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-ink-faint mb-4">
                  We found {detectedSubs.length} likely subscription
                  {detectedSubs.length !== 1 ? "s" : ""} based on repeated
                  billing patterns. Select the ones you want to add.
                </p>

                {/* Select all */}
                <label className="flex items-center gap-3 p-3 rounded-card border border-border hover:bg-surface-alt transition-colors mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIndices.size === detectedSubs.length}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded accent-[var(--color-primary)]"
                  />
                  <span className="text-[13px] font-semibold text-ink">
                    {selectedIndices.size === detectedSubs.length
                      ? "Deselect all"
                      : "Select all"}
                  </span>
                </label>

                {/* Detected list */}
                <div className="max-h-[320px] overflow-y-auto space-y-2 mb-5">
                  {detectedSubs.map((sub, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-card border transition-colors cursor-pointer ${
                        sub.status === "existing"
                          ? "border-border-light bg-surface-alt opacity-60"
                          : selectedIndices.has(i)
                            ? "border-primary bg-primary-shadow"
                            : "border-border hover:bg-surface-alt"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(i)}
                        onChange={() => toggleIndex(i)}
                        disabled={sub.status === "existing"}
                        className="w-4 h-4 rounded accent-[var(--color-primary)]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">
                          {sub.name}
                        </p>
                        <p className="text-[11px] text-ink-faint">
                          {sub.billingCycle !== "unknown"
                            ? sub.billingCycle
                            : "irregular"}{" "}
                          · {sub.occurrences} payments
                          {sub.status === "existing" && " · Already tracked"}
                        </p>
                        {sub.reasons && sub.reasons.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[10px] text-ink-ghost uppercase tracking-wider mb-0.5">
                              Why we detected it
                            </p>
                            <ul className="text-[10px] text-ink-faint leading-relaxed">
                              {sub.reasons.map((reason, ri) => (
                                <li key={ri}>· {reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-ink shrink-0">
                        {formatCurrency(sub.amount, sub.currency)}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSkip}
                    className="flex-1 ui-btn-secondary"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleBulkAdd}
                    disabled={selectedIndices.size === 0}
                    className="flex-1 ui-btn-primary"
                  >
                    Add{" "}
                    {selectedIndices.size > 0
                      ? `(${selectedIndices.size})`
                      : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Adding */}
        {uploadStep === "adding" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="ui-spinner" />
            <p className="text-[14px] text-ink text-center">
              Adding your subscriptions...
            </p>
          </div>
        )}

        {/* Done */}
        {uploadStep === "done" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-success-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-ink mb-1">
                {addedCount} subscription{addedCount !== 1 ? "s" : ""} added
              </p>
              <p className="text-[12px] text-ink-faint">
                Your subscriptions have been updated.
              </p>
            </div>
            <button onClick={closeUploadModal} className="ui-btn-primary mt-2">
              Done
            </button>
          </div>
        )}

        {/* Failed */}
        {uploadStep === "failed" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-error-bg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-error-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-semibold text-ink mb-1">
                Something went wrong
              </p>
              <p className="text-[12px] text-ink-faint">
                {uploadError || "Please try again."}
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={closeUploadModal} className="ui-btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  setUploadStep("idle");
                  setUploadError("");
                }}
                className="ui-btn-primary"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={closeDelete}
        title="Delete subscription"
      >
        {deleteTarget && (
          <div>
            <p className="text-[14px] text-ink-muted leading-relaxed mb-6">
              Are you sure you want to delete{" "}
              <strong className="text-ink">{deleteTarget.name}</strong>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeDelete} className="flex-1 ui-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-button text-[13px] font-semibold bg-error-text text-white transition-all hover:bg-error-deep disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add / Edit Form Modal ─────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={`${editingId ? "Edit" : "Add"} subscription`}
      >
        {formError && (
          <div className="bg-error-bg border border-error-border text-error-text text-[13px] p-3 rounded-button mb-4">
            {formError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Name">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Netflix"
              className="ui-input"
            />
          </FormField>
          <FormField label="Provider">
            <input
              required
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              placeholder="e.g. Netflix Inc."
              className="ui-input"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="ui-input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Billing cycle">
              <select
                value={form.billingCycle}
                onChange={(e) =>
                  setForm({ ...form, billingCycle: e.target.value })
                }
                className="ui-input"
              >
                {CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount">
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="ui-input"
              />
            </FormField>
            <FormField label="Currency">
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="ui-input"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </FormField>
          </div>
          <FormField label="Next billing date">
            <input
              required
              type="date"
              value={form.nextBillingDate}
              onChange={(e) =>
                setForm({ ...form, nextBillingDate: e.target.value })
              }
              className="ui-input"
            />
          </FormField>
          {editingId && (
            <FormField label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="ui-input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </FormField>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 ui-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 ui-btn-primary"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingSpinner />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          title="No subscriptions found"
          description={
            filters.search || filters.status
              ? "Try adjusting your search or filters."
              : "You're not tracking any subscriptions yet."
          }
          action={
            !filters.search && !filters.status ? (
              <button onClick={openAddOptions} className="ui-btn-primary">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add subscription
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="ui-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Name
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Provider
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Cycle
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Next renewal
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-ink-faint text-[10px] uppercase tracking-[1px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => {
                  const colors =
                    CATEGORY_COLORS[s.category] || CATEGORY_COLORS.other;
                  return (
                    <tr
                      key={s._id}
                      className="border-b border-border-light last:border-0 hover:bg-surface-alt transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-badge flex items-center justify-center text-[11px] font-bold ${colors.bg} ${colors.text}`}
                          >
                            {s.name[0]}
                          </div>
                          <span className="font-semibold text-ink">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-ink-muted">{s.provider}</td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        {formatCurrency(
                          convert(
                            Number(s.amount),
                            s.currency || "USD",
                            userCurrency,
                          ),
                          userCurrency,
                        )}
                      </td>
                      <td className="px-5 py-4 text-ink-muted capitalize">
                        {s.billingCycle}
                      </td>
                      <td className="px-5 py-4 text-ink-muted">
                        {new Date(s.nextBillingDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`ui-badge ${
                            s.status === "active"
                              ? "bg-cat-education-bg text-cat-education-text"
                              : s.status === "cancelled"
                                ? "bg-error-bg text-error-action"
                                : "bg-cat-finance-bg text-cat-finance-text"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-ink-faint hover:text-primary mr-3 transition-colors text-[12px] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDelete(s)}
                          className="text-ink-faint hover:text-error-action transition-colors text-[12px] font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
