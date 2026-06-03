import { escapeAttribute, escapeHtml } from "../lib/utils";

export interface ProjectPreviewMetric {
  label: string;
  value: string;
}

export interface ProjectModalProps {
  fileUrl: string;
  fileName: string;
  fileSize: string;
  title: string;
  description: string | null;
  category: string;
  metrics: ProjectPreviewMetric[];
  totalPages: number;
}

export function renderProjectModal(props: ProjectModalProps): string {
  const safeTotalPages = Math.max(1, props.totalPages);
  const subtitle = props.description?.trim() || "Preview dokumen project portfolio.";
  const iframeUrl = `${props.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`;

  return `<section class="project-preview-card" data-project-modal-root data-total-pages="${safeTotalPages}">
        <div class="project-preview-topbar">
            <div class="project-preview-file">
                <span class="project-preview-file-icon material-symbols-outlined">picture_as_pdf</span>
                <div>
                    <strong>${escapeHtml(props.fileName)}</strong>
                    <span>${escapeHtml(props.fileSize)} KB &middot; ${safeTotalPages} page${safeTotalPages === 1 ? "" : "s"}</span>
                </div>
            </div>
            <span class="project-preview-badge">PDF</span>
        </div>

        <button type="button" class="project-preview-thumb" data-project-modal-open aria-label="Buka preview ${escapeAttribute(props.title)}">
            <div class="project-preview-paper">
                <span>${escapeHtml(props.category)}</span>
                <h2>${escapeHtml(props.title)}</h2>
                <p>${escapeHtml(subtitle)}</p>
                <div class="project-preview-metrics">
                    ${props.metrics.map((metric) => `<div>
                        <small>${escapeHtml(metric.label)}</small>
                        <strong>${escapeHtml(metric.value)}</strong>
                    </div>`).join("")}
                </div>
            </div>
            <span class="project-preview-overlay">
                <span>Buka preview</span>
            </span>
        </button>

        <div class="project-preview-footer">
            <span>Hover untuk preview &middot; klik untuk buka</span>
            <button type="button" class="project-preview-view-button" data-project-modal-open>
                <span class="material-symbols-outlined" aria-hidden="true">visibility</span>
                <span>View project</span>
            </button>
        </div>

        <div class="project-modal-backdrop" data-project-modal hidden>
            <div class="project-modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
                <header class="project-modal-header">
                    <div class="project-modal-file">
                        <span class="material-symbols-outlined" aria-hidden="true">picture_as_pdf</span>
                        <strong id="project-modal-title">${escapeHtml(props.fileName)}</strong>
                    </div>
                    <div class="project-modal-header-actions">
                        <span>Tekan ESC untuk tutup</span>
                        <button type="button" data-project-modal-close aria-label="Tutup preview">&times;</button>
                    </div>
                </header>

                <div class="project-modal-body">
                    <iframe src="${escapeAttribute(iframeUrl)}" title="PDF preview: ${escapeAttribute(props.title)}" loading="lazy"></iframe>
                </div>

                <footer class="project-modal-footer">
                    <div class="project-modal-pages">
                        <button type="button" data-project-page-prev aria-label="Halaman sebelumnya" ${safeTotalPages === 1 ? "disabled" : ""}>
                            <span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                        </button>
                        <span data-project-page-label>Halaman 1 / ${safeTotalPages}</span>
                        <button type="button" data-project-page-next aria-label="Halaman berikutnya" ${safeTotalPages === 1 ? "disabled" : ""}>
                            <span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                        </button>
                    </div>
                    <button type="button" class="project-modal-text-close" data-project-modal-close>Tutup &times;</button>
                </footer>
            </div>
        </div>
    </section>`;
}
