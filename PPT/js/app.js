// js/app.js - Modular Component Loader & Slide Queue Controller

class SlideCraftApp {
    constructor() {
        this.currentStep = 1;
        this.selectedTemplate = 'Sermon Classic';
        this.slidesQueue = []; // Queue to store all added slides
        this.selectedPreview = -1; // Currently selected slide index for live preview
        this.editingIndex = -1; // Index of slide being edited (content only)

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeEnlargedPreview();
            if (e.key === 'ArrowLeft') this.prevPreview();
            if (e.key === 'ArrowRight') this.nextPreview();
        });
    }

getTheme() {
        const themes = {
            'Sermon Classic': {
                font: 'Inter',
                bg: '0B192C', bg2: '050C16', glow: '1E3A8A',
                frame: 'FFD700', accent: 'FFD700', accent2: 'FFF3B0',
                text: 'FFFFFF', card: '132A4A', onCard: 'E2E8F0',
                badge: 'FFD700', onBadge: '0B192C',
                layout: 'classic',
                shadow: ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)']
            },
            'Elegant Heritage': {
                font: 'Georgia',
                bg: 'F6EFE6', bg2: 'E8D9BF', glow: 'EBD1B7',
                frame: '9B2A2E', accent: '9B2A2E', accent2: 'C05A3B',
                text: '2B2118', card: 'FFFFFF', onCard: '4A3A2E',
                badge: '9B2A2E', onBadge: 'FFFFFF',
                layout: 'classic',
                shadow: ['rgba(35,15,10,0.4)', 'rgba(35,15,10,0.35)']
            },
            'Midnight Aurora': {
                font: 'Montserrat',
                bg: '0D1117', bg2: '161B22', glow: '164E63',
                frame: '22D3EE', accent: '22D3EE', accent2: 'A78BFA',
                text: 'FFFFFF', card: '1F2937', onCard: 'E2E8F0',
                badge: '22D3EE', onBadge: '0D1117',
                layout: 'modern',
                shadow: ['rgba(2,6,23,0.75)', 'rgba(2,6,23,0.65)']
            },
            'Forest Chapel': {
                font: 'Cambria',
                bg: '0E2A1E', bg2: '06140E', glow: '1B4D36',
                frame: 'D9B36C', accent: 'D9B36C', accent2: 'F4E4BC',
                text: 'F6F1E3', card: '1A3A2A', onCard: 'E9E2CE',
                badge: 'D9B36C', onBadge: '0E2A1E',
                layout: 'chapel',
                shadow: ['rgba(6,20,14,0.9)', 'rgba(6,20,14,0.8)']
            },
            'Lilac Grace': {
                font: 'Palatino',
                bg: 'F3EEFC', bg2: 'E8DDF9', glow: 'D4C4F7',
                frame: '8B5CF6', accent: '7C3AED', accent2: 'C4B5FD',
                hl: 'C0522E', text: '2E1065', card: 'FFFFFF', onCard: '4C1D95',
                badge: '7C3AED', onBadge: 'FFFFFF',
                layout: 'lilac',
                shadow: ['rgba(109,40,217,0.35)', 'rgba(109,40,217,0.25)']
            },
            'Rose Atelier': {
                font: 'Georgia',
                bg: 'FBF5EF', bg2: 'F2E7DC', glow: 'E9C7C8',
                frame: 'A64A52', accent: 'A64A52', accent2: 'E2A9B0',
                hl: 'A64A52', text: '3A2328', card: 'FFFFFF', onCard: '7A4A52',
                badge: 'A64A52', onBadge: 'FFFFFF',
                layout: 'rose',
                shadow: ['rgba(60,25,35,0.22)', 'rgba(60,25,35,0.16)']
            }
        };
        return themes[this.selectedTemplate] || themes['Sermon Classic'];
    }

    hex(hex) {
        return '#' + hex;
    }
    goToStep(step) {
        this.currentStep = step;
        document.getElementById('view-step-1').classList.toggle('hidden', step !== 1);
        document.getElementById('view-step-2').classList.toggle('hidden', step !== 2);
        document.getElementById('view-step-3').classList.toggle('hidden', step !== 3);
        
        const labels = { 1: 'Dashboard', 2: 'Templates', 3: 'Content Builder' };
        document.getElementById('current-step-label').innerText = labels[step] || 'Dashboard';
    }

    selectTemplate(templateName) {
        this.selectedTemplate = templateName;
        document.getElementById('selected-template-name').innerText = templateName;
        this._markSelectedTemplate(templateName);
        this.goToStep(3);
        this.renderSlideQueue();
    }

    // Highlight the live selection across both template choosers (grid + modal)
    // so the selected template gets a real amber ring + SELECTED badge.
    _markSelectedTemplate(name) {
        document.querySelectorAll('[data-template]').forEach((el) => {
            el.setAttribute('data-selected', el.getAttribute('data-template') === name);
        });
    }

    openModal(modalId) {
        // Close every modal first so only one dialog is ever visible/stacked
        const allModals = ['title-modal', 'point-modal', 'verse-modal', 'message-modal', 'template-modal'];
        allModals.forEach((id) => {
            const m = document.getElementById(id);
            if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        });
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        // Opening a modal abandons any pending edit; labels default back to "Add" mode
        this.editingIndex = -1;
        this.resetModalLabelsFor(modalId);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
        // Closing a modal cancels any pending edit so the next add really adds
        this.editingIndex = -1;
    }

    resetModalLabelsFor(modalId) {
        const cfg = {
            'title-modal': { h: 'title-modal-heading', b: 'title-modal-submit', ht: 'Add Title Slide', bt: 'Add Title Slide' },
            'point-modal': { h: 'point-modal-heading', b: 'point-modal-submit', ht: 'Add Point Slide', bt: 'Add Point Slide' },
            'verse-modal': { h: 'verse-modal-heading', b: 'verse-modal-submit', ht: 'Add Verse Slide', bt: 'Add Verse Slide' },
            'message-modal': { h: 'message-modal-heading', b: 'message-modal-submit', ht: 'Add Message Slide', bt: 'Add Message Slide' }
        };
        const c = cfg[modalId];
        if (!c) return;
        const hEl = document.getElementById(c.h);
        const bEl = document.getElementById(c.b);
        if (hEl) hEl.innerText = c.ht;
        if (bEl) bEl.innerText = c.bt;
    }

    addTitleSlide() {
        const rawTitle = document.getElementById('input-title').value.trim();
        const verseText = document.getElementById('input-verse').value.trim();
        const footerText = document.getElementById('input-title-footer').value.trim();
        const highlights = this.collectHighlights('title-highlight-fields');
        if (!rawTitle) { this.showToast('Please enter a sermon title.', 'error'); return; }

        if (this.editingIndex >= 0 && this.slidesQueue[this.editingIndex]) {
            const target = this.slidesQueue[this.editingIndex];
            target.title = rawTitle;
            target.verse = verseText;
            target.footer = footerText;
            target.highlights = highlights;
            const editedIdx = this.editingIndex;
            this.editingIndex = -1;
            this.closeModal('title-modal');
            this.clearTitleInputs();
            this.selectedPreview = editedIdx;
            this.showToast(`Title Slide #${editedIdx + 1} updated.`, 'success');
            this.renderSlideQueue();
            return;
        }

        this.slidesQueue.push({
            type: 'title',
            title: rawTitle,
            verse: verseText,
            footer: footerText,
            highlights: highlights
        });

        this.closeModal('title-modal');
        this.clearTitleInputs();
        this.selectedPreview = this.slidesQueue.length - 1;
        this.showToast(`Title Slide #${this.slidesQueue.length} added to queue.`, 'success');
        this.renderSlideQueue();
    }

    clearTitleInputs() {
        document.getElementById('input-title').value = '';
        this.renderHighlightRows('title-highlight-fields', ['']);
        document.getElementById('input-verse').value = '';
        document.getElementById('input-title-footer').value = '';
    }

    addPointSlide() {
        const badgeText = document.getElementById('input-point-badge').value.trim();
        const rawPointTitle = document.getElementById('input-point-title').value.trim();
        const highlights = this.collectHighlights('highlight-fields');
        const descText = document.getElementById('input-point-desc').value.trim();
        if (!rawPointTitle) { this.showToast('Please enter a point statement.', 'error'); return; }

        if (this.editingIndex >= 0 && this.slidesQueue[this.editingIndex]) {
            const target = this.slidesQueue[this.editingIndex];
            target.badge = badgeText;
            target.title = rawPointTitle;
            target.highlights = highlights;
            target.desc = descText;
            const editedIdx = this.editingIndex;
            this.editingIndex = -1;
            this.closeModal('point-modal');
            this.clearPointInputs();
            this.selectedPreview = editedIdx;
            this.showToast(`Point Slide #${editedIdx + 1} updated.`, 'success');
            this.renderSlideQueue();
            return;
        }

        this.slidesQueue.push({
            type: 'point',
            badge: badgeText,
            title: rawPointTitle,
            highlights: highlights,
            desc: descText
        });

        this.closeModal('point-modal');
        this.clearPointInputs();
        this.selectedPreview = this.slidesQueue.length - 1;
        this.showToast(`Point Slide #${this.slidesQueue.length} added to queue.`, 'success');
        this.renderSlideQueue();
    }

    init() {
        this.renderHighlightRows('highlight-fields', ['']);
        this.renderHighlightRows('message-highlight-fields', ['']);
        this.renderHighlightRows('title-highlight-fields', ['']);
        this._markSelectedTemplate(this.selectedTemplate);
    }

    // Normalize the highlights of a slide into an array of phrases.
    getHighlights(s) {
        if (Array.isArray(s.highlights)) return s.highlights;
        if (s.highlight) return [s.highlight];
        return [];
    }

    highlightRowHtml(containerId, index, value) {
        const v = this.escapeHtml(value || '');
        return `
            <div class="flex gap-2">
                <input class="hl-input flex-1 min-w-0 w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500" type="text" placeholder="e.g. UNSHAKABLE HOPE" value="${v}" />
                <button onclick="app.removeHighlightRow('${containerId}', ${index})" type="button" title="Remove" class="px-3 py-2 rounded-xl border border-red-500/40 text-red-400 font-bold">&times;</button>
            </div>`;
    }

    renderHighlightRows(containerId, phrases) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;
        const list = phrases && phrases.length ? phrases : [''];
        wrap.innerHTML = list.map((p, i) => this.highlightRowHtml(containerId, i, p)).join('');
    }

    addHighlightRow(containerId) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;
        const count = wrap.querySelectorAll('.hl-input').length;
        wrap.insertAdjacentHTML('beforeend', this.highlightRowHtml(containerId, count, ''));
    }

    removeHighlightRow(containerId, i) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;
        const row = wrap.children[i];
        if (row) row.remove();
        if (!wrap.querySelector('.hl-input')) this.renderHighlightRows(containerId, ['']);
    }

    collectHighlights(containerId) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return [];
        return Array.from(wrap.querySelectorAll('.hl-input'))
            .map((el) => el.value.trim())
            .filter(Boolean);
    }

    // Split a body of text into { text, hl } segments, marking the parts that
    // match any highlight phrase (case-insensitive, whole-phrase match). Used
    // to render paragraph-style highlights in message slides.
    splitHighlightSegments(text, highlights) {
        const list = (highlights || []).map((p) => String(p || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
        if (!list.length) return [{ text: String(text || ''), hl: false }];
        const re = new RegExp('(' + list.map((p) => this.escapeRegExp(p)).join('|') + ')', 'gi');
        return String(text || '').split(re).map((part, i) => ({ text: part, hl: i % 2 === 1 }));
    }

    // Escape a body of text and wrap every highlighted phrase in the highlight span.
    highlightPhrasesHtml(text, highlights, hlClass) {
        const hl = hlClass || 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF3B0] to-[#FFD700]';
        const segments = this.splitHighlightSegments(text, highlights);
        return segments.map((seg) => seg.hl
            ? `<span class="${hl}">${this.escapeHtml(seg.text)}</span>`
            : this.escapeHtml(seg.text)).join('');
    }

    // Render a title (auto-balanced two lines) as HTML, highlighting only the
    // user-chosen words. Non-highlighted words inherit the h1 text color, so a
    // title with no highlights renders plainly (no auto-highlight).
    renderTitleHighlightHtml(s, hlClass) {
        const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
        const tHl = this.computePointHighlight(words, this.getHighlights(s));
        const n1 = words.length >= 3 ? words.length - 2 : (words.length === 2 ? 1 : 0);
        const render = (start, end) => words.slice(start, end).map((w, i) =>
            tHl.hlIdx.has(start + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : this.escapeHtml(w)
        ).join(' ');
        return `${n1 ? `${render(0, n1)}<br />` : ''}${render(n1, words.length)}`;
    }

    clearPointInputs() {
        document.getElementById('input-point-badge').value = '';
        document.getElementById('input-point-title').value = '';
        this.renderHighlightRows('highlight-fields', ['']);
        document.getElementById('input-point-desc').value = '';
    }

    addVerseSlide() {
        const refText = document.getElementById('input-verse-ref').value.trim();
        const bodyText = document.getElementById('input-verse-body').value.trim();
        const versionText = document.getElementById('input-verse-version').value.trim();
        if (!bodyText) { this.showToast('Please enter the verse text.', 'error'); return; }

        if (this.editingIndex >= 0 && this.slidesQueue[this.editingIndex]) {
            const target = this.slidesQueue[this.editingIndex];
            target.ref = refText;
            target.text = bodyText;
            target.version = versionText;
            const editedIdx = this.editingIndex;
            this.editingIndex = -1;
            this.closeModal('verse-modal');
            this.clearVerseInputs();
            this.selectedPreview = editedIdx;
            this.showToast(`Verse Slide #${editedIdx + 1} updated.`, 'success');
            this.renderSlideQueue();
            return;
        }

        this.slidesQueue.push({
            type: 'verse',
            ref: refText,
            text: bodyText,
            version: versionText
        });

        this.closeModal('verse-modal');
        this.clearVerseInputs();
        this.selectedPreview = this.slidesQueue.length - 1;
        this.showToast(`Verse Slide #${this.slidesQueue.length} added to queue.`, 'success');
        this.renderSlideQueue();
    }

    clearVerseInputs() {
        document.getElementById('input-verse-ref').value = '';
        document.getElementById('input-verse-body').value = '';
        document.getElementById('input-verse-version').value = '';
    }

    addMessageSlide() {
        const messageText = document.getElementById('input-message-text').value.trim();
        const highlights = this.collectHighlights('message-highlight-fields');
        const refText = document.getElementById('input-message-ref').value.trim();
        const footerText = document.getElementById('input-message-footer').value.trim();
        if (!messageText) { this.showToast('Please enter a message.', 'error'); return; }

        if (this.editingIndex >= 0 && this.slidesQueue[this.editingIndex]) {
            const target = this.slidesQueue[this.editingIndex];
            target.text = messageText;
            target.highlights = highlights;
            target.ref = refText;
            target.footer = footerText;
            const editedIdx = this.editingIndex;
            this.editingIndex = -1;
            this.closeModal('message-modal');
            this.clearMessageInputs();
            this.selectedPreview = editedIdx;
            this.showToast(`Message Slide #${editedIdx + 1} updated.`, 'success');
            this.renderSlideQueue();
            return;
        }

        this.slidesQueue.push({
            type: 'message',
            text: messageText,
            highlights: highlights,
            ref: refText,
            footer: footerText
        });

        this.closeModal('message-modal');
        this.clearMessageInputs();
        this.selectedPreview = this.slidesQueue.length - 1;
        this.showToast(`Message Slide #${this.slidesQueue.length} added to queue.`, 'success');
        this.renderSlideQueue();
    }

    clearMessageInputs() {
        document.getElementById('input-message-text').value = '';
        this.renderHighlightRows('message-highlight-fields', ['']);
        document.getElementById('input-message-ref').value = '';
        document.getElementById('input-message-footer').value = '';
    }

    exportToPowerPoint() {
        if (this.slidesQueue.length === 0) {
            this.showToast('Please add at least one slide before exporting.', 'error');
            return;
        }

        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';
        const C = this.getTheme();

        this.slidesQueue.forEach(slideData => {
            // Midnight Aurora renders its own modern slide layout. The font-size
            // min/max rules and the slide-adding rules are identical to the
            // classic templates - only design, colors, font, format & organization differ.
            if (C.layout === 'modern') {
                this.addModernSlide(pptx, slideData, C);
                return;
            } else if (C.layout === 'chapel') {
                this.addChapelSlide(pptx, slideData, C);
                return;
            } else if (C.layout === 'lilac') {
                this.addLilacSlide(pptx, slideData, C);
                return;
            } else if (C.layout === 'rose') {
                this.addRoseSlide(pptx, slideData, C);
                return;
            }
                        if (slideData.type === 'title') {
                let slide = pptx.addSlide();
                slide.background = { color: C.bg };
                // Background glow gradient
                slide.addShape('rect', {
                    x: 0, y: 0, w: '100%', h: '100%',
                    fill: { type: 'gradient', color1: C.bg, color2: C.bg2, angle: 45 },
                    line: { type: 'none' }
                });
                // Inner double frame
                slide.addShape('rect', {
                    x: 0.2, y: 0.2, w: 12.93, h: 7.1,
                    fill: { type: 'none' },
                    line: { color: C.frame, transparency: 80, width: 1.25 }
                });
                // Split title (auto-balanced two lines); only user-highlighted words are accented
                const tWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
                const tHl = this.computePointHighlight(tWords, this.getHighlights(slideData));
                const tN1 = tWords.length >= 3 ? tWords.length - 2 : (tWords.length === 2 ? 1 : 0);
                const tLine1 = tWords.slice(0, tN1).join(' ');
                const tLine2 = tWords.slice(tN1).join(' ');
                const tRuns = (start, end) => tWords.slice(start, end).map((w, i) => ({
                    text: (i ? ' ' : '') + w,
                    options: tHl.hlIdx.has(start + i)
                        ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                        : { color: C.text }
                }));
                // Auto-fit title font so the lines never overlap
                                const tChars = Math.max(tLine1.length, tLine2.length, 1);
                const tLines = (tLine1 ? 1 : 0) + 1;
                const widthFit = Math.floor(816 / (0.62 * tChars));
                const heightFit = Math.floor(260 / (1.22 * tLines));
                const titlePt = Math.max(30, Math.min(50, widthFit, heightFit) + 8);
                const pitch = titlePt * 1.22 / 72;
                const blockH = tLines * pitch;
                const titleTop = 0.45 + Math.max(0, (4.6 - blockH) / 2);
                if (tLine1) {
                    slide.addText(tRuns(0, tN1), {
                        x: 1.0, y: titleTop, w: 11.33, h: pitch,
                        align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                    });
                }
                slide.addText(tRuns(tN1, tWords.length), {
                    x: 1.0, y: titleTop + (tLine1 ? pitch : 0), w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
                // Verse (auto-fit so long passages stay clear of the footer)
                const versePt = Math.min(22, Math.max(12, Math.floor(816 / (0.5 * Math.max(String(slideData.verse || '').length, 1)))));
                slide.addText(slideData.verse, {
                    x: 1.0, y: 5.55, w: 11.33, h: 0.7,
                    align: 'center', fontFace: C.font, fontSize: versePt, bold: true, color: C.text, charSpacing: 2
                });
                // Footer badge (optional)
                if (slideData.footer) {
                    slide.addShape('roundRect', {
                        x: 4.67, y: 6.35, w: 4.0, h: 0.62, rectRadius: 0.1,
                        fill: { color: C.card, transparency: 10 },
                        line: { color: C.frame, transparency: 50, width: 1 }
                    });
                    slide.addText(slideData.footer, {
                        x: 4.67, y: 6.45, w: 4.0, h: 0.42,
                        align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard
                    });
                }
                        } else if (slideData.type === 'point') {
                let slide = pptx.addSlide();
                slide.background = { color: C.bg };
                // Radial center glow
                slide.addShape('ellipse', {
                    x: 3.5, y: 1.4, w: 6.33, h: 4.6,
                    fill: { color: C.glow, transparency: 65 },
                    line: { type: 'none' }
                });
                // Inner double frame
                slide.addShape('rect', {
                    x: 0.2, y: 0.2, w: 12.93, h: 7.1,
                    fill: { type: 'none' },
                    line: { color: C.frame, transparency: 80, width: 1.25 }
                });
                // Top "POINT" badge
                const badgeText = slideData.badge ? slideData.badge : 'POINT';
                slide.addShape('roundRect', {
                    x: 5.16, y: 0.45, w: 3.0, h: 0.52, rectRadius: 0.26,
                    fill: { color: C.accent },
                    line: { type: 'none' }
                });
                slide.addText(badgeText, {
                    x: 5.16, y: 0.53, w: 3.0, h: 0.36,
                    align: 'center', fontFace: C.font, fontSize: 11, bold: true, color: C.onBadge, charSpacing: 3
                });
                // Split point title: first words white, last words gold gradient
                const ptWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
                const ptHl = this.computePointHighlight(ptWords, this.getHighlights(slideData));
                const ptLine1 = ptWords.slice(0, ptHl.brIndex + 1);
                const ptLine2 = ptWords.slice(ptHl.brIndex + 1);
                const ptRuns = (arr, offset) => arr.map((w, i) => ({
                    text: (i ? ' ' : '') + w,
                    options: ptHl.hlIdx.has(offset + i)
                        ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                        : { color: C.text }
                }));
                // Rules-based sizing: estimate how many lines the point wraps to,
                // then pick the title font size from a tier table. Point text is
                // much bigger than the verse tiers (min & max).
                const ptLines = (ptLine1.length ? 1 : 0) + (ptLine2.length ? 1 : 0);
                const ptCharsPerLine = Math.max(8, Math.floor(816 / (0.62 * 38))); // ~34 chars at mid size
                const ptLongestLine = Math.max(ptLine1.join(' ').length, ptLine2.join(' ').length, 1);
                const ptEstLines = Math.max(ptLines, Math.ceil(ptLongestLine / ptCharsPerLine));
                const PT_FONT_TIERS = [
                    { maxLines: 1, size: 48 }, // 1-line point -> biggest
                    { maxLines: 2, size: 42 }, // 2-line point -> big
                    { maxLines: 3, size: 36 }, // 3-line point -> medium
                    { maxLines: Infinity, size: 30 }, // 4+ lines -> smallest (still much bigger than verse)
                ];
                const titlePt = PT_FONT_TIERS.find((t) => ptEstLines <= t.maxLines).size;
                const pitch = titlePt * 1.22 / 72;
                const blockH = ptLines * pitch;
                const titleTop = 2.2 + Math.max(0, (2.4 - blockH) / 2);
                if (ptLine1.length) {
                    slide.addText(ptRuns(ptLine1, 0), {
                        x: 1.0, y: titleTop, w: 11.33, h: pitch,
                        align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                    });
                }
                slide.addText(ptRuns(ptLine2, ptLine1.length), {
                    x: 1.0, y: titleTop + (ptLine1.length ? pitch : 0), w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
                // Bottom sub-point card
                if (slideData.desc) {
                    slide.addShape('roundRect', {
                        x: 3.0, y: 6.05, w: 7.33, h: 0.78, rectRadius: 0.08,
                        fill: { color: C.card, transparency: 10 },
                        line: { color: C.frame, transparency: 50, width: 1 }
                    });
                    slide.addText(slideData.desc, {
                        x: 3.0, y: 6.16, w: 7.33, h: 0.55,
                        align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard
                    });
                }
            } else if (slideData.type === 'verse') {
                let slide = pptx.addSlide();
                slide.background = { color: C.bg };
                // Radial center glow
                slide.addShape('ellipse', {
                    x: 3.5, y: 1.4, w: 6.33, h: 4.6,
                    fill: { color: C.glow, transparency: 65 },
                    line: { type: 'none' }
                });
                // Inner double frame
                slide.addShape('rect', {
                    x: 0.2, y: 0.2, w: 12.93, h: 7.1,
                    fill: { type: 'none' },
                    line: { color: C.frame, transparency: 80, width: 1.25 }
                });
                // Reference card (dark fill + gold left accent bar)
                const refText = slideData.ref || '';
                const refWidth = Math.max(2.0, Math.min(8.0, refText.length * 0.18));
                const refX = (13.33 - refWidth) / 2;
                slide.addShape('rect', { x: refX, y: 2.25, w: refWidth, h: 0.68, fill: { color: C.card }, line: { type: 'none' } });
                slide.addShape('rect', { x: refX, y: 2.25, w: 0.12, h: 0.68, fill: { color: C.accent }, line: { type: 'none' } });
                slide.addText(refText, {
                    x: refX, y: 2.34, w: refWidth, h: 0.5,
                    align: 'center', fontFace: C.font, fontSize: 16, bold: true, color: C.accent, charSpacing: 2
                });
                // Main verse text (rules-based: 2 lines -> big, 3 lines -> current, 4+ -> smaller)
                const textLen = Math.max(String(slideData.text || '').length, 1);
                const charsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 30))); // ~46 chars at current size
                const estLines = Math.ceil(textLen / charsPerLine);
                let bodyPt = 30; // current size (3-line verse)
                if (estLines <= 2) bodyPt = 40;          // 2-line verse -> big
                else if (estLines === 4) bodyPt = 26;    // 4-line verse -> smaller
                else if (estLines >= 5) bodyPt = 22;     // 5+ lines -> smallest
                slide.addText(`"${slideData.text}"`, {
                    x: 1.0, y: 3.2, w: 11.33, h: 2.8,
                    align: 'center', fontFace: C.font, fontSize: bodyPt, bold: true, color: C.text, breakLine: false
                });
                // Bottom version metadata
                slide.addText(slideData.version, {
                    x: 2.0, y: 6.3, w: 9.33, h: 0.4,
                    align: 'center', fontFace: C.font, fontSize: 12, bold: true, color: C.accent, transparency: 30
                });
            } else if (slideData.type === 'message') {
                let slide = pptx.addSlide();
                slide.background = { color: C.bg };
                // Radial center glow
                slide.addShape('ellipse', {
                    x: 3.5, y: 1.4, w: 6.33, h: 4.6,
                    fill: { color: C.glow, transparency: 65 },
                    line: { type: 'none' }
                });
                // Inner double frame
                slide.addShape('rect', {
                    x: 0.2, y: 0.2, w: 12.93, h: 7.1,
                    fill: { type: 'none' },
                    line: { color: C.frame, transparency: 80, width: 1.25 }
                });
                // Rules-based sizing: longer messages tier down gradually. Min = 30, Max = 48.
                const mCharsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 40))); // ~35 chars at mid size
                const mEstLines = Math.ceil(Math.max(String(slideData.text || '').length, 1) / mCharsPerLine);
                const MESSAGE_FONT_TIERS = [
                    { maxLines: 2, size: 48 }, // 2-line message -> max size
                    { maxLines: 3, size: 40 }, // 3-line message -> big
                    { maxLines: 4, size: 36 }, // 4-line message -> medium
                    { maxLines: Infinity, size: 30 }, // 5+ lines -> min size
                ];
                const mBodyPt = MESSAGE_FONT_TIERS.find((t) => mEstLines <= t.maxLines).size;
                // Top reference (optional)
                if (slideData.ref) {
                    slide.addText(slideData.ref, {
                        x: 2.0, y: 0.5, w: 9.33, h: 0.4,
                        align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                    });
                }
                // Main message text (highlighted phrases get the gold gradient)
                const msgSegs = this.splitHighlightSegments(slideData.text, this.getHighlights(slideData));
                const msgRuns = msgSegs.map((seg) => ({
                    text: seg.text,
                    options: seg.hl
                        ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                        : { color: C.text }
                }));
                slide.addText(msgRuns, {
                    x: 1.0, y: 2.2, w: 11.33, h: 3.6,
                    align: 'center', fontFace: C.font, fontSize: mBodyPt, bold: true, breakLine: false
                });
                // Bottom footer (optional)
                if (slideData.footer) {
                    slide.addText(slideData.footer, {
                        x: 2.0, y: 6.3, w: 9.33, h: 0.4,
                        align: 'center', fontFace: C.font, fontSize: 12, bold: true, color: C.accent, transparency: 30
                    });
                }
            }
        });

        try {
            const base64 = pptx.write({ outputType: 'base64' });
            const a = document.createElement('a');
            a.href = 'data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,' + base64;
            a.download = 'SlideCraft-Presentation.pptx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            this.showToast(`Downloading SlideCraft-Presentation.pptx (${this.slidesQueue.length} slide${this.slidesQueue.length > 1 ? 's' : ''}).`, 'success');
                } catch (err) {
            console.error(err);
            this.showToast('Export failed: ' + err.message, 'error');
        }
    }

    // Download the deck as a PDF, rendered from each slide's live preview
    // design (html2canvas + jsPDF). Keeps the same 16:9 format as the preview.
    async exportPDF() {
        if (this.slidesQueue.length === 0) {
            this.showToast('Please add at least one slide before exporting.', 'error');
            return;
        }
        if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            this.showToast('PDF libraries are still loading — please try again in a moment.', 'error');
            return;
        }
        try {
            this.showToast(`Building PDF (${this.slidesQueue.length} slide${this.slidesQueue.length > 1 ? 's' : ''})…`, 'info');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'in', format: [13.333, 7.5], compress: true });

            const host = document.createElement('div');
            host.style.position = 'fixed';
            host.style.left = '-9999px';
            host.style.top = '0';
            host.style.width = '1280px';
            host.style.zIndex = '-1';
            host.style.pointerEvents = 'none';
            document.body.appendChild(host);

            if (document.fonts && document.fonts.ready) await document.fonts.ready;

            for (let i = 0; i < this.slidesQueue.length; i++) {
                host.innerHTML = this.renderSlideVisual(this.slidesQueue[i]);
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                if (document.fonts && document.fonts.ready) await document.fonts.ready;

                const slideEl = host.firstElementChild;
                if (!slideEl) continue;

                const canvas = await window.html2canvas(slideEl, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#0B192C',
                    logging: false
                });
                if (i > 0) pdf.addPage([13.333, 7.5], 'landscape');
                pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 13.333, 7.5);
            }

            document.body.removeChild(host);
            pdf.save('SlideCraft-Presentation.pdf');
            this.showToast(`Downloaded SlideCraft-Presentation.pdf (${this.slidesQueue.length} slide${this.slidesQueue.length > 1 ? 's' : ''}).`, 'success');
        } catch (err) {
            console.error(err);
            this.showToast('Export failed: ' + err.message, 'error');
        }
    }

    // ============================================================
    // Midnight Aurora - modern layout PPTX export
    // Different design / colors / font / format / organization, but
    // the SAME font-size min/max rules (identical pt tier tables) and
    // the same slide content rules as the classic templates.
    // ============================================================
    addModernSlide(pptx, slideData, C) {
        const addBg = (slide) => {
            // Diagonal gradient base
            slide.addShape('rect', {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { type: 'gradient', color1: C.bg, color2: C.bg2, angle: 45 },
                line: { type: 'none' }
            });
            // Top-right geometric accent block
            slide.addShape('roundRect', {
                x: 8.6, y: -1.4, w: 6.6, h: 5.0, rectRadius: 0.4,
                fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0, transparency: 75 },
                line: { type: 'none' },
                rotate: 12
            });
            // Bottom-left diamond outline
            slide.addShape('rect', {
                x: -0.7, y: 4.4, w: 1.6, h: 1.6,
                fill: { type: 'none' },
                line: { color: C.accent, transparency: 75, width: 1.5 },
                rotate: 45
            });
            // Left vertical accent bar
            slide.addShape('rect', {
                x: 0, y: 0, w: 0.22, h: 7.5,
                fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 90 },
                line: { type: 'none' }
            });
        };
        const addFooterStrip = (slide, text) => {
            if (!text) return;
            slide.addShape('rect', {
                x: 0, y: 6.55, w: 13.33, h: 0.95,
                fill: { color: C.card, transparency: 20 },
                line: { color: C.frame, transparency: 60, width: 1 }
            });
            slide.addText(text, {
                x: 1.0, y: 6.72, w: 11.0, h: 0.55,
                align: 'left', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard, charSpacing: 2
            });
        };

        if (slideData.type === 'title') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Split title (auto-balanced two lines); only user-highlighted words are accented
            const tWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const tHl = this.computePointHighlight(tWords, this.getHighlights(slideData));
            const tN1 = tWords.length >= 3 ? tWords.length - 2 : (tWords.length === 2 ? 1 : 0);
            const tLine1 = tWords.slice(0, tN1).join(' ');
            const tLine2 = tWords.slice(tN1).join(' ');
            const tRuns = (start, end) => tWords.slice(start, end).map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: tHl.hlIdx.has(start + i)
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            const tChars = Math.max(tLine1.length, tLine2.length, 1);
            const tLines = (tLine1 ? 1 : 0) + 1;
            const widthFit = Math.floor(816 / (0.62 * tChars));
            const heightFit = Math.floor(260 / (1.22 * tLines));
            const titlePt = Math.max(30, Math.min(50, widthFit, heightFit) + 8);
            const pitch = titlePt * 1.22 / 72;
            const blockH = tLines * pitch;
            const titleTop = 1.55 + Math.max(0, (3.2 - blockH) / 2);
            if (tLine1) {
                slide.addText(tRuns(0, tN1), {
                    x: 1.0, y: titleTop, w: 11.0, h: pitch,
                    align: 'left', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(tRuns(tN1, tWords.length), {
                x: 1.0, y: titleTop + (tLine1 ? pitch : 0), w: 11.0, h: pitch,
                align: 'left', fontFace: C.font, fontSize: titlePt, bold: true
            });
            // Verse (same auto-fit rule as classic)
            const versePt = Math.min(22, Math.max(12, Math.floor(816 / (0.5 * Math.max(String(slideData.verse || '').length, 1)))));
            slide.addText(slideData.verse, {
                x: 1.0, y: 5.2, w: 11.0, h: 0.6,
                align: 'left', fontFace: C.font, fontSize: versePt, bold: true, color: C.accent, charSpacing: 2
            });
            addFooterStrip(slide, slideData.footer);
        } else if (slideData.type === 'point') {

            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top-left point badge (square chip)
            const badgeText = slideData.badge ? slideData.badge : 'POINT';
            slide.addShape('roundRect', {
                x: 1.0, y: 0.5, w: 1.8, h: 0.5, rectRadius: 0.06,
                fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 },
                line: { type: 'none' }
            });
            slide.addText(badgeText, {
                x: 1.0, y: 0.56, w: 1.8, h: 0.38,
                align: 'center', fontFace: C.font, fontSize: 11, bold: true, color: C.onBadge, charSpacing: 3
            });
            // Split point title + highlight runs (same rules as classic, min 30 / max 48 pt)
            const ptWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const ptHl = this.computePointHighlight(ptWords, this.getHighlights(slideData));
            const ptLine1 = ptWords.slice(0, ptHl.brIndex + 1);
            const ptLine2 = ptWords.slice(ptHl.brIndex + 1);
            const ptRuns = (arr, offset) => arr.map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: ptHl.hlIdx.has(offset + i)
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            const ptLines = (ptLine1.length ? 1 : 0) + (ptLine2.length ? 1 : 0);
            const ptCharsPerLine = Math.max(8, Math.floor(816 / (0.62 * 38)));
            const ptLongestLine = Math.max(ptLine1.join(' ').length, ptLine2.join(' ').length, 1);
            const ptEstLines = Math.max(ptLines, Math.ceil(ptLongestLine / ptCharsPerLine));
            const PT_FONT_TIERS = [
                { maxLines: 1, size: 48 },
                { maxLines: 2, size: 42 },
                { maxLines: 3, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const titlePt = PT_FONT_TIERS.find((t) => ptEstLines <= t.maxLines).size;
            const pitch = titlePt * 1.22 / 72;
            const blockH = ptLines * pitch;
            const titleTop = 1.7 + Math.max(0, (2.9 - blockH) / 2);
            if (ptLine1.length) {
                slide.addText(ptRuns(ptLine1, 0), {
                    x: 1.0, y: titleTop, w: 11.0, h: pitch,
                    align: 'left', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(ptRuns(ptLine2, ptLine1.length), {
                x: 1.0, y: titleTop + (ptLine1.length ? pitch : 0), w: 11.0, h: pitch,
                align: 'left', fontFace: C.font, fontSize: titlePt, bold: true
            });
            // Bottom description strip (full-width, left accent bar)
            if (slideData.desc) {
                slide.addShape('rect', {
                    x: 0, y: 6.55, w: 13.33, h: 0.95,
                    fill: { color: C.card, transparency: 20 },
                    line: { color: C.frame, transparency: 60, width: 1 }
                });
                slide.addShape('rect', {
                    x: 1.0, y: 6.68, w: 0.1, h: 0.7,
                    fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 90 },
                    line: { type: 'none' }
                });
                slide.addText(slideData.desc, {
                    x: 1.35, y: 6.72, w: 10.6, h: 0.55,
                    align: 'left', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'verse') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Reference chip (left, square with accent edge)
            if (slideData.ref) {
                const refW = Math.max(2.0, Math.min(6.0, slideData.ref.length * 0.18));
                slide.addShape('rect', {
                    x: 1.0, y: 0.55, w: refW, h: 0.6,
                    fill: { color: C.card },
                    line: { color: C.accent, transparency: 50, width: 1 }
                });
                slide.addShape('rect', {
                    x: 1.0, y: 0.55, w: 0.12, h: 0.6,
                    fill: { color: C.accent },
                    line: { type: 'none' }
                });
                slide.addText(slideData.ref, {
                    x: 1.35, y: 0.62, w: refW - 0.35, h: 0.46,
                    align: 'left', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Verse body (same tier rules as classic: 2-line 40, 3-line 30, 4-line 26, 5+ line 22)
            const textLen = Math.max(String(slideData.text || '').length, 1);
            const charsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 30)));
            const estLines = Math.ceil(textLen / charsPerLine);
            let bodyPt = 30;
            if (estLines <= 2) bodyPt = 40;
            else if (estLines === 4) bodyPt = 26;
            else if (estLines >= 5) bodyPt = 22;
            slide.addText(`"${slideData.text}"`, {
                x: 1.0, y: 1.9, w: 11.0, h: 3.6,
                align: 'left', fontFace: C.font, fontSize: bodyPt, bold: true, color: C.text, breakLine: false
            });
            // Version rendered in the footer strip
            addFooterStrip(slide, slideData.version);
        } else if (slideData.type === 'message') {

            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top reference kicker (left)
            if (slideData.ref) {
                const refW = Math.max(2.0, Math.min(6.0, slideData.ref.length * 0.18));
                slide.addShape('rect', {
                    x: 1.0, y: 0.55, w: refW, h: 0.5,
                    fill: { color: C.card },
                    line: { color: C.accent, transparency: 50, width: 1 }
                });
                slide.addShape('rect', {
                    x: 1.0, y: 0.55, w: 0.12, h: 0.5,
                    fill: { color: C.accent },
                    line: { type: 'none' }
                });
                slide.addText(slideData.ref, {
                    x: 1.35, y: 0.62, w: refW - 0.35, h: 0.38,
                    align: 'left', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Message body (same tier rules as classic: 2-line 48, 3-line 40, 4-line 36, 5+ line 30)
            const mCharsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 40)));
            const mEstLines = Math.ceil(Math.max(String(slideData.text || '').length, 1) / mCharsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 48 },
                { maxLines: 3, size: 40 },
                { maxLines: 4, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const mBodyPt = MESSAGE_FONT_TIERS.find((t) => mEstLines <= t.maxLines).size;
            const msgSegs = this.splitHighlightSegments(slideData.text, this.getHighlights(slideData));
            const msgRuns = msgSegs.map((seg) => ({
                text: seg.text,
                options: seg.hl
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            slide.addText(msgRuns, {
                x: 1.0, y: 1.9, w: 11.0, h: 3.9,
                align: 'left', fontFace: C.font, fontSize: mBodyPt, bold: true, breakLine: false
            });
            addFooterStrip(slide, slideData.footer);
        }
    }


    // ============================================================
    // Forest Chapel - ornate centered layout PPTX export
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (centered "chapel" layout with ornamental gold dividers), but the
    // font-size rules are identical to the classic templates (same pt
    // tier tables / auto-fit bounds, including the +8pt title headline).
    // ============================================================
    addChapelSlide(pptx, slideData, C) {
        const addBg = (slide) => {
            // Diagonal gradient base
            slide.addShape('rect', {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { type: 'gradient', color1: C.bg, color2: C.bg2, angle: 45 },
                line: { type: 'none' }
            });
            // Soft radial center glow
            slide.addShape('ellipse', {
                x: 3.4, y: 1.2, w: 6.5, h: 5.0,
                fill: { color: C.glow, transparency: 68 },
                line: { type: 'none' }
            });
            // Double frame
            slide.addShape('rect', {
                x: 0.2, y: 0.2, w: 12.93, h: 7.1,
                fill: { type: 'none' },
                line: { color: C.frame, transparency: 75, width: 1.25 }
            });
            // Gold corner accents
            const tick = (x, y) => slide.addShape('rect', {
                x: x, y: y, w: 0.65, h: 0.05,
                fill: { color: C.accent }, line: { type: 'none' }
            });
            tick(0.2, 0.2); tick(12.48, 0.2); tick(0.2, 7.25); tick(12.48, 7.25);
        };
        const addDivider = (slide, y) => {
            // Ornamental centered divider: gold rule - diamond - gold rule
            slide.addShape('rect', { x: 5.15, y: y + 0.05, w: 2.6, h: 0.035, fill: { color: C.accent }, line: { type: 'none' } });
            slide.addShape('rect', { x: 6.56, y: y, w: 0.21, h: 0.21, fill: { color: C.accent }, line: { type: 'none' }, rotate: 45 });
            slide.addShape('rect', { x: 7.98, y: y + 0.05, w: 2.6, h: 0.035, fill: { color: C.accent }, line: { type: 'none' } });
        };
        const addCenteredPill = (slide, text, y, h) => {
            const w = Math.max(2.0, Math.min(6.0, String(text || '').length * 0.18));
            slide.addShape('roundRect', {
                x: (13.33 - w) / 2, y: y, w: w, h: h, rectRadius: 0.08,
                fill: { color: C.card, transparency: 15 },
                line: { color: C.accent, transparency: 50, width: 1 }
            });
            return w;
        };

        if (slideData.type === 'title') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            addDivider(slide, 0.55);
            // Split title (auto-balanced two lines); only user-highlighted words are accented
            const tWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const tHl = this.computePointHighlight(tWords, this.getHighlights(slideData));
            const tN1 = tWords.length >= 3 ? tWords.length - 2 : (tWords.length === 2 ? 1 : 0);
            const tLine1 = tWords.slice(0, tN1).join(' ');
            const tLine2 = tWords.slice(tN1).join(' ');
            const tRuns = (start, end) => tWords.slice(start, end).map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: tHl.hlIdx.has(start + i)
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            const tChars = Math.max(tLine1.length, tLine2.length, 1);
            const tLines = (tLine1 ? 1 : 0) + 1;
            const widthFit = Math.floor(816 / (0.62 * tChars));
            const heightFit = Math.floor(260 / (1.22 * tLines));
            const titlePt = Math.max(30, Math.min(50, widthFit, heightFit) + 8);
            const pitch = titlePt * 1.22 / 72;
            const blockH = tLines * pitch;
            // Scripture Reference sits directly beneath the title (like templates 1 & 2)
            const versePt = Math.min(22, Math.max(12, Math.floor(816 / (0.5 * Math.max(String(slideData.verse || '').length, 1)))));
            const verseGap = 0.3;
            const verseH = 0.7;
            const groupH = blockH + verseGap + verseH;
            const titleTop = 0.75 + Math.max(0, (4.4 - groupH) / 2);
            if (tLine1) {
                slide.addText(tRuns(0, tN1), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(tRuns(tN1, tWords.length), {
                x: 1.0, y: titleTop + (tLine1 ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            slide.addText(slideData.verse, {
                x: 1.0, y: titleTop + blockH + verseGap, w: 11.33, h: verseH,
                align: 'center', fontFace: C.font, fontSize: versePt, bold: true, color: C.accent, charSpacing: 2
            });
            // Bottom ornamental divider + ministry name
            if (slideData.footer) {
                addDivider(slide, 6.15);
                slide.addText(slideData.footer, {
                    x: 2.0, y: 6.5, w: 9.33, h: 0.5,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'point') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top centered point badge (gold pill)
            const badgeText = slideData.badge ? slideData.badge : 'POINT';
            slide.addShape('roundRect', {
                x: 5.16, y: 0.45, w: 3.0, h: 0.52, rectRadius: 0.26,
                fill: { color: C.badge }, line: { type: 'none' }
            });
            slide.addText(badgeText, {
                x: 5.16, y: 0.53, w: 3.0, h: 0.36,
                align: 'center', fontFace: C.font, fontSize: 11, bold: true, color: C.onBadge, charSpacing: 3
            });
            // Split point title + highlight runs (same rules as classic, min 30 / max 48 pt)
            const ptWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const ptHl = this.computePointHighlight(ptWords, this.getHighlights(slideData));
            const ptLine1 = ptWords.slice(0, ptHl.brIndex + 1);
            const ptLine2 = ptWords.slice(ptHl.brIndex + 1);
            const ptRuns = (arr, offset) => arr.map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: ptHl.hlIdx.has(offset + i)
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            const ptLines = (ptLine1.length ? 1 : 0) + (ptLine2.length ? 1 : 0);
            const ptCharsPerLine = Math.max(8, Math.floor(816 / (0.62 * 38)));
            const ptLongestLine = Math.max(ptLine1.join(' ').length, ptLine2.join(' ').length, 1);
            const ptEstLines = Math.max(ptLines, Math.ceil(ptLongestLine / ptCharsPerLine));
            const PT_FONT_TIERS = [
                { maxLines: 1, size: 48 },
                { maxLines: 2, size: 42 },
                { maxLines: 3, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const titlePt = PT_FONT_TIERS.find((t) => ptEstLines <= t.maxLines).size;
            const pitch = titlePt * 1.22 / 72;
            const blockH = ptLines * pitch;
            const titleTop = 1.7 + Math.max(0, (2.9 - blockH) / 2);
            if (ptLine1.length) {
                slide.addText(ptRuns(ptLine1, 0), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(ptRuns(ptLine2, ptLine1.length), {
                x: 1.0, y: titleTop + (ptLine1.length ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            // Bottom description card (centered)
            if (slideData.desc) {
                slide.addShape('roundRect', {
                    x: 2.6, y: 6.15, w: 8.13, h: 0.62, rectRadius: 0.1,
                    fill: { color: C.card, transparency: 15 },
                    line: { color: C.frame, transparency: 50, width: 1 }
                });
                slide.addText(slideData.desc, {
                    x: 2.6, y: 6.24, w: 8.13, h: 0.44,
                    align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'verse') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Reference pill (centered)
            if (slideData.ref) {
                const refW = addCenteredPill(slide, slideData.ref, 0.55, 0.6);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.46,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Verse body (same tier rules as classic: 2-line 40, 3-line 30, 4-line 26, 5+ line 22)
            const textLen = Math.max(String(slideData.text || '').length, 1);
            const charsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 30)));
            const estLines = Math.ceil(textLen / charsPerLine);
            let bodyPt = 30;
            if (estLines <= 2) bodyPt = 40;
            else if (estLines === 4) bodyPt = 26;
            else if (estLines >= 5) bodyPt = 22;
            slide.addText(`"${slideData.text}"`, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.6,
                align: 'center', fontFace: C.font, fontSize: bodyPt, bold: true, color: C.text, breakLine: false
            });
            // Version metadata (centered bottom)
            if (slideData.version) {
                slide.addText(slideData.version, {
                    x: 2.0, y: 6.3, w: 9.33, h: 0.4,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, transparency: 30, charSpacing: 2
                });
            }
        } else if (slideData.type === 'message') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top reference kicker (centered pill)
            if (slideData.ref) {
                const refW = addCenteredPill(slide, slideData.ref, 0.55, 0.52);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.38,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Message body (same tier rules as classic: 2-line 48, 3-line 40, 4-line 36, 5+ line 30)
            const mCharsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 40)));
            const mEstLines = Math.ceil(Math.max(String(slideData.text || '').length, 1) / mCharsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 48 },
                { maxLines: 3, size: 40 },
                { maxLines: 4, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const mBodyPt = MESSAGE_FONT_TIERS.find((t) => mEstLines <= t.maxLines).size;
            const msgSegs = this.splitHighlightSegments(slideData.text, this.getHighlights(slideData));
            const msgRuns = msgSegs.map((seg) => ({
                text: seg.text,
                options: seg.hl
                    ? { fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 0 } }
                    : { color: C.text }
            }));
            slide.addText(msgRuns, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.9,
                align: 'center', fontFace: C.font, fontSize: mBodyPt, bold: true, breakLine: false
            });
            // Footer strip (centered)
            if (slideData.footer) {
                slide.addShape('rect', {
                    x: 0, y: 6.55, w: 13.33, h: 0.95,
                    fill: { color: C.card, transparency: 20 },
                    line: { color: C.frame, transparency: 60, width: 1 }
                });
                slide.addText(slideData.footer, {
                    x: 1.0, y: 6.72, w: 11.33, h: 0.55,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard, charSpacing: 2
                });
            }
        }
    }



// ============================================================
    // Lilac Grace - soft light-purple layout PPTX export
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (airy, rounded "cloud" layout on a light lavender palette), but the
    // font-size rules are identical to the classic templates (same pt
    // tier tables / auto-fit bounds, including the +8pt title headline).
    // ============================================================
    addLilacSlide(pptx, slideData, C) {
        const addBg = (slide) => {
            // Soft diagonal gradient base (light lavender)
            slide.addShape('rect', {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { type: 'gradient', color1: C.bg, color2: C.bg2, angle: 55 },
                line: { type: 'none' }
            });
            // Rounded inner "cloud" frame
            slide.addShape('roundRect', {
                x: 0.25, y: 0.25, w: 12.83, h: 7.0, rectRadius: 0.18,
                fill: { type: 'none' },
                line: { color: C.frame, transparency: 50, width: 1.25 }
            });
            // Soft corner dots
            const dot = (x, y) => slide.addShape('ellipse', {
                x: x, y: y, w: 0.18, h: 0.18,
                fill: { color: C.accent, transparency: 35 }, line: { type: 'none' }
            });
            dot(0.28, 0.28); dot(12.87, 0.28); dot(0.28, 7.04); dot(12.87, 7.04);
        };
        const addPill = (slide, text, y, w, h) => {
            slide.addShape('roundRect', {
                x: (13.33 - w) / 2, y: y, w: w, h: h, rectRadius: h / 2,
                fill: { color: C.card, transparency: 15 },
                line: { color: C.accent, transparency: 55, width: 1 }
            });
        };
        const addRefPillW = (text) => Math.max(2.2, Math.min(6.2, String(text || '').length * 0.19));

        if (slideData.type === 'title') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Split title (auto-balanced two lines); only user-highlighted words are accented
            const tWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const tHl = this.computePointHighlight(tWords, this.getHighlights(slideData));
            const tN1 = tWords.length >= 3 ? tWords.length - 2 : (tWords.length === 2 ? 1 : 0);
            const tLine1 = tWords.slice(0, tN1).join(' ');
            const tLine2 = tWords.slice(tN1).join(' ');
            const tRuns = (start, end) => tWords.slice(start, end).map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: tHl.hlIdx.has(start + i)
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            const tChars = Math.max(tLine1.length, tLine2.length, 1);
            const tLines = (tLine1 ? 1 : 0) + 1;
            const widthFit = Math.floor(816 / (0.62 * tChars));
            const heightFit = Math.floor(260 / (1.22 * tLines));
            const titlePt = Math.max(30, Math.min(50, widthFit, heightFit) + 8);
            const pitch = titlePt * 1.22 / 72;
            const blockH = tLines * pitch;
            // Scripture Reference directly beneath the title
            const versePt = Math.min(22, Math.max(12, Math.floor(816 / (0.5 * Math.max(String(slideData.verse || '').length, 1)))));
            const verseGap = 0.3;
            const verseH = 0.7;
            const groupH = blockH + verseGap + verseH;
            const titleTop = 0.85 + Math.max(0, (4.2 - groupH) / 2);
            if (tLine1) {
                slide.addText(tRuns(0, tN1), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(tRuns(tN1, tWords.length), {
                x: 1.0, y: titleTop + (tLine1 ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            slide.addText(slideData.verse, {
                x: 1.0, y: titleTop + blockH + verseGap, w: 11.33, h: verseH,
                align: 'center', fontFace: C.font, fontSize: versePt, bold: true, color: C.accent, charSpacing: 2
            });
            // Bottom ministry name
            if (slideData.footer) {
                slide.addText(slideData.footer, {
                    x: 2.0, y: 6.55, w: 9.33, h: 0.5,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'point') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top centered soft point pill
            const badgeText = slideData.badge ? slideData.badge : 'POINT';
            const bw = Math.max(2.4, Math.min(4.0, badgeText.length * 0.32));
            addPill(slide, badgeText, 0.5, bw, 0.5);
            slide.addText(badgeText, {
                x: (13.33 - bw) / 2, y: 0.56, w: bw, h: 0.38,
                align: 'center', fontFace: C.font, fontSize: 11, bold: true, color: C.accent, charSpacing: 3
            });
            // Split point title + highlight runs (same rules as classic, min 30 / max 48 pt)
            const ptWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const ptHl = this.computePointHighlight(ptWords, this.getHighlights(slideData));
            const ptLine1 = ptWords.slice(0, ptHl.brIndex + 1);
            const ptLine2 = ptWords.slice(ptHl.brIndex + 1);
            const ptRuns = (arr, offset) => arr.map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: ptHl.hlIdx.has(offset + i)
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            const ptLines = (ptLine1.length ? 1 : 0) + (ptLine2.length ? 1 : 0);
            const ptCharsPerLine = Math.max(8, Math.floor(816 / (0.62 * 38)));
            const ptLongestLine = Math.max(ptLine1.join(' ').length, ptLine2.join(' ').length, 1);
            const ptEstLines = Math.max(ptLines, Math.ceil(ptLongestLine / ptCharsPerLine));
            const PT_FONT_TIERS = [
                { maxLines: 1, size: 48 },
                { maxLines: 2, size: 42 },
                { maxLines: 3, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const titlePt = PT_FONT_TIERS.find((t) => ptEstLines <= t.maxLines).size;
            const pitch = titlePt * 1.22 / 72;
            const blockH = ptLines * pitch;
            const titleTop = 1.7 + Math.max(0, (2.9 - blockH) / 2);
            if (ptLine1.length) {
                slide.addText(ptRuns(ptLine1, 0), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(ptRuns(ptLine2, ptLine1.length), {
                x: 1.0, y: titleTop + (ptLine1.length ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            // Bottom description chip (centered)
            if (slideData.desc) {
                slide.addShape('roundRect', {
                    x: 2.6, y: 6.15, w: 8.13, h: 0.6, rectRadius: 0.3,
                    fill: { color: C.card, transparency: 15 },
                    line: { color: C.frame, transparency: 50, width: 1 }
                });
                slide.addText(slideData.desc, {
                    x: 2.6, y: 6.24, w: 8.13, h: 0.44,
                    align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'verse') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Reference pill (centered)
            if (slideData.ref) {
                const refW = addRefPillW(slideData.ref);
                addPill(slide, slideData.ref, 0.55, refW, 0.6);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.46,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Verse body (same tier rules as classic: 2-line 40, 3-line 30, 4-line 26, 5+ line 22)
            const textLen = Math.max(String(slideData.text || '').length, 1);
            const charsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 30)));
            const estLines = Math.ceil(textLen / charsPerLine);
            let bodyPt = 30;
            if (estLines <= 2) bodyPt = 40;
            else if (estLines === 4) bodyPt = 26;
            else if (estLines >= 5) bodyPt = 22;
            slide.addText(`"${slideData.text}"`, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.6,
                align: 'center', fontFace: C.font, fontSize: bodyPt, bold: true, color: C.text, breakLine: false
            });
            // Version metadata (centered bottom)
            if (slideData.version) {
                slide.addText(slideData.version, {
                    x: 2.0, y: 6.3, w: 9.33, h: 0.4,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, transparency: 30, charSpacing: 2
                });
            }
                } else if (slideData.type === 'message') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top reference kicker (centered pill)
            if (slideData.ref) {
                const refW = addRefPillW(slideData.ref);
                addPill(slide, slideData.ref, 0.55, refW, 0.52);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.38,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
                        // Message body (same tier rules as classic: 2-line 48, 3-line 40, 4-line 36, 5+ line 30)
            const mText = slideData.text || '';
            const mCharsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 40)));
            const mEstLines = Math.ceil(Math.max(String(mText).length, 1) / mCharsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 48 },
                { maxLines: 3, size: 40 },
                { maxLines: 4, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const mBodyPt = MESSAGE_FONT_TIERS.find((t) => mEstLines <= t.maxLines).size;
            const mRuns = this.splitHighlightSegments(mText, this.getHighlights(slideData)).map((seg) => ({
                text: seg.text,
                options: seg.hl
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            slide.addText(mRuns, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.9,
                align: 'center', fontFace: C.font, fontSize: mBodyPt, bold: true, breakLine: false
            });
            // Footer strip (centered) — footer text + version on one line
            const footText = (slideData.footer ? slideData.footer : '') +
                (slideData.version ? (slideData.footer ? ' · ' : '') + slideData.version : '');
            if (footText) {
                slide.addShape('roundRect', {
                    x: 0, y: 6.55, w: 13.33, h: 0.85, rectRadius: 0.2,
                    fill: { color: C.card, transparency: 20 },
                    line: { color: C.frame, transparency: 55, width: 1 }
                });
                slide.addText(footText, {
                    x: 1.0, y: 6.7, w: 11.33, h: 0.55,
                    align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard, charSpacing: 2
                });
            }
        }
    }
// ============================================================
    // Rose Atelier - warm ivory & rose editorial layout PPTX export
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (left rose accent bar, hairline frame, squared chips and diamond
    // flourishes on a warm ivory palette), but the font-size rules are
    // identical to the classic templates (same pt tier tables / auto-fit
    // bounds, including the +8pt title headline).
    // ============================================================
    addRoseSlide(pptx, slideData, C) {
        const addBg = (slide) => {
            // Warm ivory diagonal gradient base
            slide.addShape('rect', {
                x: 0, y: 0, w: '100%', h: '100%',
                fill: { type: 'gradient', color1: C.bg, color2: C.bg2, angle: 55 },
                line: { type: 'none' }
            });
            // Left vertical rose accent bar
            slide.addShape('rect', {
                x: 0, y: 0, w: 0.14, h: 7.5,
                fill: { type: 'gradient', color1: C.accent, color2: C.accent2, angle: 90 },
                line: { type: 'none' }
            });
            // Hairline inner frame
            slide.addShape('rect', {
                x: 0.25, y: 0.25, w: 12.83, h: 7.0,
                fill: { type: 'none' },
                line: { color: C.frame, transparency: 45, width: 1 }
            });
            // Corner diamond ornaments
            const diamond = (x, y) => slide.addShape('rect', {
                x: x, y: y, w: 0.14, h: 0.14, rotate: 45,
                fill: { color: C.accent, transparency: 30 }, line: { type: 'none' }
            });
            diamond(0.3, 0.3); diamond(12.89, 0.3); diamond(0.3, 7.06); diamond(12.89, 7.06);
        };
        const addChip = (slide, text, y, w, h) => {
            slide.addShape('roundRect', {
                x: (13.33 - w) / 2, y: y, w: w, h: h, rectRadius: 0.05,
                fill: { color: C.card, transparency: 15 },
                line: { color: C.accent, transparency: 40, width: 1 }
            });
        };
        const addRefChipW = (text) => Math.max(2.2, Math.min(6.2, String(text || '').length * 0.19));
        const addFootDiamond = (slide, y) => {
            slide.addShape('rect', {
                x: 6.62, y: y, w: 0.09, h: 0.09, rotate: 45,
                fill: { color: C.accent, transparency: 25 }, line: { type: 'none' }
            });
        };

        if (slideData.type === 'title') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Split title (auto-balanced two lines); only user-highlighted words are accented
            const tWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const tHl = this.computePointHighlight(tWords, this.getHighlights(slideData));
            const tN1 = tWords.length >= 3 ? tWords.length - 2 : (tWords.length === 2 ? 1 : 0);
            const tLine1 = tWords.slice(0, tN1).join(' ');
            const tLine2 = tWords.slice(tN1).join(' ');
            const tRuns = (start, end) => tWords.slice(start, end).map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: tHl.hlIdx.has(start + i)
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            const tChars = Math.max(tLine1.length, tLine2.length, 1);
            const tLines = (tLine1 ? 1 : 0) + 1;
            const widthFit = Math.floor(816 / (0.62 * tChars));
            const heightFit = Math.floor(260 / (1.22 * tLines));
            const titlePt = Math.max(30, Math.min(50, widthFit, heightFit) + 8);
            const pitch = titlePt * 1.22 / 72;
            const blockH = tLines * pitch;
            // Scripture Reference directly beneath the title
            const versePt = Math.min(22, Math.max(12, Math.floor(816 / (0.5 * Math.max(String(slideData.verse || '').length, 1)))));
            const verseGap = 0.3;
            const verseH = 0.7;
            const groupH = blockH + verseGap + verseH;
            const titleTop = 0.85 + Math.max(0, (4.2 - groupH) / 2);
            if (tLine1) {
                slide.addText(tRuns(0, tN1), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(tRuns(tN1, tWords.length), {
                x: 1.0, y: titleTop + (tLine1 ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            slide.addText(slideData.verse, {
                x: 1.0, y: titleTop + blockH + verseGap, w: 11.33, h: verseH,
                align: 'center', fontFace: C.font, fontSize: versePt, bold: true, color: C.accent, charSpacing: 2
            });
            // Bottom ministry name with small diamond flourish
            if (slideData.footer) {
                addFootDiamond(slide, 6.42);
                slide.addText(slideData.footer, {
                    x: 2.0, y: 6.55, w: 9.33, h: 0.5,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'point') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top centered squared point chip
            const badgeText = slideData.badge ? slideData.badge : 'POINT';
            const bw = Math.max(2.4, Math.min(4.0, badgeText.length * 0.32));
            addChip(slide, badgeText, 0.5, bw, 0.5);
            slide.addText(badgeText, {
                x: (13.33 - bw) / 2, y: 0.56, w: bw, h: 0.38,
                align: 'center', fontFace: C.font, fontSize: 11, bold: true, color: C.accent, charSpacing: 3
            });
            // Split point title + highlight runs (same rules as classic, min 30 / max 48 pt)
            const ptWords = String(slideData.title || '').trim().split(/\s+/).filter(Boolean);
            const ptHl = this.computePointHighlight(ptWords, this.getHighlights(slideData));
            const ptLine1 = ptWords.slice(0, ptHl.brIndex + 1);
            const ptLine2 = ptWords.slice(ptHl.brIndex + 1);
            const ptRuns = (arr, offset) => arr.map((w, i) => ({
                text: (i ? ' ' : '') + w,
                options: ptHl.hlIdx.has(offset + i)
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            const ptLines = (ptLine1.length ? 1 : 0) + (ptLine2.length ? 1 : 0);
            const ptCharsPerLine = Math.max(8, Math.floor(816 / (0.62 * 38)));
            const ptLongestLine = Math.max(ptLine1.join(' ').length, ptLine2.join(' ').length, 1);
            const ptEstLines = Math.max(ptLines, Math.ceil(ptLongestLine / ptCharsPerLine));
            const PT_FONT_TIERS = [
                { maxLines: 1, size: 48 },
                { maxLines: 2, size: 42 },
                { maxLines: 3, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const titlePt = PT_FONT_TIERS.find((t) => ptEstLines <= t.maxLines).size;
            const pitch = titlePt * 1.22 / 72;
            const blockH = ptLines * pitch;
            const titleTop = 1.7 + Math.max(0, (2.9 - blockH) / 2);
            if (ptLine1.length) {
                slide.addText(ptRuns(ptLine1, 0), {
                    x: 1.0, y: titleTop, w: 11.33, h: pitch,
                    align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
                });
            }
            slide.addText(ptRuns(ptLine2, ptLine1.length), {
                x: 1.0, y: titleTop + (ptLine1.length ? pitch : 0), w: 11.33, h: pitch,
                align: 'center', fontFace: C.font, fontSize: titlePt, bold: true
            });
            // Bottom description chip (centered)
            if (slideData.desc) {
                slide.addShape('roundRect', {
                    x: 2.6, y: 6.15, w: 8.13, h: 0.6, rectRadius: 0.06,
                    fill: { color: C.card, transparency: 15 },
                    line: { color: C.frame, transparency: 45, width: 1 }
                });
                slide.addText(slideData.desc, {
                    x: 2.6, y: 6.24, w: 8.13, h: 0.44,
                    align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard
                });
            }
        } else if (slideData.type === 'verse') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Reference chip (centered)
            if (slideData.ref) {
                const refW = addRefChipW(slideData.ref);
                addChip(slide, slideData.ref, 0.55, refW, 0.6);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.46,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Verse body (same tier rules as classic: 2-line 40, 3-line 30, 4-line 26, 5+ line 22)
            const textLen = Math.max(String(slideData.text || '').length, 1);
            const charsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 30)));
            const estLines = Math.ceil(textLen / charsPerLine);
            let bodyPt = 30;
            if (estLines <= 2) bodyPt = 40;
            else if (estLines === 4) bodyPt = 26;
            else if (estLines >= 5) bodyPt = 22;
            slide.addText(`"${slideData.text}"`, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.6,
                align: 'center', fontFace: C.font, fontSize: bodyPt, bold: true, color: C.text, breakLine: false
            });
            // Version metadata (centered bottom) with diamond flourish
            if (slideData.version) {
                addFootDiamond(slide, 6.22);
                slide.addText(slideData.version, {
                    x: 2.0, y: 6.32, w: 9.33, h: 0.4,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, transparency: 30, charSpacing: 2
                });
            }
        } else if (slideData.type === 'message') {
            let slide = pptx.addSlide();
            slide.background = { color: C.bg };
            addBg(slide);
            // Top reference kicker (centered chip)
            if (slideData.ref) {
                const refW = addRefChipW(slideData.ref);
                addChip(slide, slideData.ref, 0.55, refW, 0.52);
                slide.addText(slideData.ref, {
                    x: (13.33 - refW) / 2, y: 0.62, w: refW, h: 0.38,
                    align: 'center', fontFace: C.font, fontSize: 14, bold: true, color: C.accent, charSpacing: 2
                });
            }
            // Message body (same tier rules as classic: 2-line 48, 3-line 40, 4-line 36, 5+ line 30)
            const mText = slideData.text || '';
            const mCharsPerLine = Math.max(8, Math.floor(815.8 / (0.58 * 40)));
            const mEstLines = Math.ceil(Math.max(String(mText).length, 1) / mCharsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 48 },
                { maxLines: 3, size: 40 },
                { maxLines: 4, size: 36 },
                { maxLines: Infinity, size: 30 }
            ];
            const mBodyPt = MESSAGE_FONT_TIERS.find((t) => mEstLines <= t.maxLines).size;
            const mRuns = this.splitHighlightSegments(mText, this.getHighlights(slideData)).map((seg) => ({
                text: seg.text,
                options: seg.hl
                    ? { color: C.hl }
                    : { color: C.text }
            }));
            slide.addText(mRuns, {
                x: 1.0, y: 1.9, w: 11.33, h: 3.9,
                align: 'center', fontFace: C.font, fontSize: mBodyPt, bold: true, breakLine: false
            });
            // Footer strip (centered) — footer text + version on one line
            const footText = (slideData.footer ? slideData.footer : '') +
                (slideData.version ? (slideData.footer ? ' · ' : '') + slideData.version : '');
            if (footText) {
                slide.addShape('roundRect', {
                    x: 0, y: 6.55, w: 13.33, h: 0.85, rectRadius: 0.08,
                    fill: { color: C.card, transparency: 20 },
                    line: { color: C.frame, transparency: 45, width: 1 }
                });
                slide.addText(footText, {
                    x: 1.0, y: 6.7, w: 11.33, h: 0.55,
                    align: 'center', fontFace: C.font, fontSize: 13, bold: true, color: C.onCard, charSpacing: 2
                });
            }
        }
    }
    showToast(message, type = 'success') {
        const area = document.getElementById('toast-area');
        if (!area) return;
        const colors = { success: '#22c55e', info: '#38bdf8', error: '#ef4444' };
        const icons = { success: 'fa-circle-check', info: 'fa-circle-info', error: 'fa-circle-xmark' };
        const el = document.createElement('div');
        el.className = 'toast-item flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B192C] border shadow-2xl text-sm font-semibold';
        el.style.borderColor = colors[type] || colors.info;
        el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}" style="color:${colors[type] || colors.info}"></i> <span style="color:${colors[type] || colors.info}">${message}</span>`;
        area.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }

    escapeHtml(text) {
        return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    escapeRegExp(text) {
        return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

        // Compute which words of a point title are highlighted and where the
    // two-line break falls. Only words matching a user-supplied highlight
    // phrase are highlighted (case-insensitive, whole-word match). When no
    // phrase is supplied the point renders plainly (no auto-highlighting);
    // the natural two-line break before the last words is still applied.
    computePointHighlight(words, highlights) {
        const hlIdx = new Set();
        if (!words.length) return { hlIdx, brIndex: -1 };
        const joined = words.join(' ');
        const phrases = (highlights || []).map((p) => String(p || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
        phrases.forEach((phrase) => {
            const re = new RegExp('(^|\\s)(' + this.escapeRegExp(phrase) + ')(?=\\s|$)', 'gi');
            let m;
            while ((m = re.exec(joined))) {
                const before = joined.slice(0, m.index);
                const startIdx = before.trim() ? before.trim().split(/\s+/).length : 0;
                const count = m[2].split(/\s+/).length;
                for (let i = startIdx; i < startIdx + count; i++) hlIdx.add(i);
                if (re.lastIndex === m.index) re.lastIndex++;
            }
        });
        let brIndex;
        if (hlIdx.size === 0) {
            // No (matched) highlights -> render plainly but keep the two-line break.
            brIndex = words.length >= 3 ? words.length - 3 : (words.length === 2 ? 0 : -1);
        } else {
            const firstHl = Math.min(...hlIdx);
            brIndex = firstHl > 0 ? firstHl - 1 : (words.length >= 3 ? words.length - 3 : (words.length === 2 ? 0 : -1));
        }
        return { hlIdx, brIndex };
    }



    deleteSlide(i) {
        if (i < 0 || i >= this.slidesQueue.length) return;
        const removed = this.slidesQueue.splice(i, 1)[0];
        if (this.slidesQueue.length === 0) {
            this.selectedPreview = -1;
        } else if (this.selectedPreview >= this.slidesQueue.length) {
            this.selectedPreview = this.slidesQueue.length - 1;
        }
        const labels = { title: 'Title', point: 'Point', verse: 'Verse', message: 'Message' };
                this.showToast(`${labels[removed.type] || 'Slide'} #${i + 1} deleted from queue.`, 'info');
        this.renderSlideQueue();
    }

    renderSlideQueue() {
        const container = document.getElementById('slide-queue');
        const badge = document.getElementById('slide-count-badge');
        if (!container || !badge) return;
        const n = this.slidesQueue.length;
        badge.innerText = `${n} slide${n === 1 ? '' : 's'}`;
        if (n === 0) {
            container.innerHTML = '<p class="text-xs text-gray-500 italic">No slides added yet. Click a button above to add your first slide.</p>';
            this.selectedPreview = -1;
            this.renderPreview();
            return;
        }
        if (this.selectedPreview < 0 || this.selectedPreview >= n) this.selectedPreview = n - 1;
        const icons = { title: 'fa-heading', point: 'fa-list-ul', verse: 'fa-book-open', message: 'fa-message' };
        const labels = { title: 'Title', point: 'Point', verse: 'Verse', message: 'Message' };
        let html = '';
        this.slidesQueue.forEach((s, i) => {
            const isNew = i === n - 1;
            const isSel = i === this.selectedPreview;
            let cls = isSel ? 'border-2 border-amber-500 bg-amber-500/15 ' : 'border border-white/15 bg-white/5 ';
            if (isNew) cls += 'slide-flash';
            const selEye = isSel ? ' <i class="fa-solid fa-eye text-amber-400"></i>' : '';
            const main = s.title || s.text || s.ref || '(untitled)';
            html += `
                <div onclick="app.previewSlide(${i})" class="flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer hover:bg-[#132A4A]/70 transition ${cls}">
                    <span class="w-7 h-7 rounded-full bg-[#132A4A] border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 flex-none">${i + 1}</span>
                    <i class="fa-solid ${icons[s.type] || 'fa-file'} text-amber-400 w-4 shrink-0 flex-none"></i>
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-bold text-white truncate">${labels[s.type] || s.type}${selEye}</p>
                        <p class="text-[11px] text-gray-300 truncate">${this.escapeHtml(main)}</p>
                    </div>
                    ${isNew ? '<span class="text-[10px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 animate-pulse">NEW</span>' : ''}
                    <button onclick="event.stopPropagation(); app.editSlide(${i})" title="Edit slide" class="text-gray-500 hover:text-amber-400 transition shrink-0 flex-none pl-1">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="event.stopPropagation(); app.deleteSlide(${i})" title="Delete slide" class="text-gray-500 hover:text-red-400 transition shrink-0 flex-none pl-1">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>`;
        });
        container.innerHTML = html;
        this.renderPreview();
    }

    previewSlide(i) {
        if (i < 0 || i >= this.slidesQueue.length) return;
        this.selectedPreview = i;
        this.renderSlideQueue();
    }

    editSlide(i) {
        if (i < 0 || i >= this.slidesQueue.length) return;
        const s = this.slidesQueue[i];
        this.selectedPreview = i;
        const editLabels = {
            title: { m: 'title-modal', h: 'title-modal-heading', b: 'title-modal-submit', ht: 'Edit Title Slide', bt: 'Save Changes' },
            point: { m: 'point-modal', h: 'point-modal-heading', b: 'point-modal-submit', ht: 'Edit Point Slide', bt: 'Save Changes' },
            verse: { m: 'verse-modal', h: 'verse-modal-heading', b: 'verse-modal-submit', ht: 'Edit Verse Slide', bt: 'Save Changes' },
            message: { m: 'message-modal', h: 'message-modal-heading', b: 'message-modal-submit', ht: 'Edit Message Slide', bt: 'Save Changes' }
        };
        const cfg = editLabels[s.type];
        if (!cfg) return;
        if (s.type === 'title') {
            document.getElementById('input-title').value = s.title || '';
            this.renderHighlightRows('title-highlight-fields', this.getHighlights(s));
            document.getElementById('input-verse').value = s.verse || '';
            document.getElementById('input-title-footer').value = s.footer || '';
        } else if (s.type === 'point') {
            document.getElementById('input-point-badge').value = s.badge || '';
            document.getElementById('input-point-title').value = s.title || '';
            this.renderHighlightRows('highlight-fields', this.getHighlights(s));
            document.getElementById('input-point-desc').value = s.desc || '';
        } else if (s.type === 'verse') {
            document.getElementById('input-verse-ref').value = s.ref || '';
            document.getElementById('input-verse-body').value = s.text || '';
            document.getElementById('input-verse-version').value = s.version || '';
        } else if (s.type === 'message') {
            document.getElementById('input-message-text').value = s.text || '';
            this.renderHighlightRows('message-highlight-fields', this.getHighlights(s));
            document.getElementById('input-message-ref').value = s.ref || '';
            document.getElementById('input-message-footer').value = s.footer || '';
        }
        this.openModal(cfg.m);
        // Mark as edit AFTER opening (openModal clears editingIndex)
        this.editingIndex = i;
        const hEl = document.getElementById(cfg.h);
        const bEl = document.getElementById(cfg.b);
        if (hEl) hEl.innerText = cfg.ht;
        if (bEl) bEl.innerText = cfg.bt;
    }

    prevPreview() { this.previewSlide(this.selectedPreview - 1); }
    nextPreview() { this.previewSlide(this.selectedPreview + 1); }

    enlargePreview() {
        if (this.slidesQueue.length === 0 || this.selectedPreview < 0) {
            this.showToast('Add a slide first, then click to enlarge.', 'info');
            return;
        }
        const modal = document.getElementById('preview-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        this.renderEnlargedPreview();
    }

    closeEnlargedPreview() {
        const modal = document.getElementById('preview-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    renderEnlargedPreview() {
        const modal = document.getElementById('preview-modal');
        const box = document.getElementById('enlarged-slide');
        const label = document.getElementById('enlarged-label');
        if (!modal || !box || !label) return;
        if (modal.classList.contains('hidden')) return;
        if (this.slidesQueue.length === 0 || this.selectedPreview < 0) {
            this.closeEnlargedPreview();
            return;
        }
                label.innerText = `Slide ${this.selectedPreview + 1} of ${this.slidesQueue.length}`;
        box.innerHTML = this.renderSlideVisual(this.slidesQueue[this.selectedPreview]);
    }

    renderPreview() {
        const box = document.getElementById('slide-preview');
        const label = document.getElementById('preview-label');
        if (!box || !label) return;
        if (this.slidesQueue.length === 0 || this.selectedPreview < 0) {
            box.innerHTML = '<div class="aspect-video flex items-center justify-center"><p class="text-xs text-gray-500 italic">Select a slide in the queue to preview it.</p></div>';
            label.innerText = '';
            this.renderEnlargedPreview();
            return;
        }
        label.innerText = `Slide ${this.selectedPreview + 1} of ${this.slidesQueue.length}`;
        box.innerHTML = this.renderSlideVisual(this.slidesQueue[this.selectedPreview]);
        this.renderEnlargedPreview();
    }

    renderSlideVisualRaw(s) {
        // The Midnight Aurora template uses its own modern layout (design,
        // format & organization differ), while the font-size rules below stay
        // exactly the same (identical cqw tier tables / min-max bounds).
        if (this.getTheme().layout === 'modern') return this.renderSlideVisualModern(s);
        if (this.getTheme().layout === 'chapel') return this.renderSlideVisualChapel(s);
        if (this.getTheme().layout === 'lilac') return this.renderSlideVisualLilac(s);
        if (this.getTheme().layout === 'rose') return this.renderSlideVisualRose(s);

        const base = 'relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-8 md:p-12 bg-[#0B192C] border border-amber-500/50';
        if (s.type === 'title') {
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            let line1 = '';
            let line2 = s.title || '';
            if (words.length >= 3) {
                line1 = words.slice(0, -2).join(' ');
                line2 = words.slice(-2).join(' ');
            } else if (words.length === 2) {
                line1 = words[0];
                line2 = words[1];
            }
            // Auto-fit preview text so nothing overlaps at any box size
            const chars = Math.max(line1.length, line2.length, 1);
            const lines = (line1 ? 1 : 0) + 1;
            const heightCap = (0.6 * 56.25) / (lines * 1.15 + 1.1);
            const widthCap = 132 / chars;
            const baseCqw = Math.min(8.5, Math.max(3.5, Math.min(heightCap, widthCap)));
            const cqw = Math.min(10.5, Math.max(5.5, baseCqw + 2.0)); // title headline +8pt
            const verseCqw = Math.round(baseCqw * 0.42 * 10) / 10;
            const footerCqw = Math.round(baseCqw * 0.26 * 10) / 10;
            return `
                <div class="relative w-full cq-container aspect-video bg-[#0B192C] border-[6px] border-[#FFD700]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:p-8 text-center">
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-[#0B192C] to-[#050C16]"></div>
                    <div class="absolute inset-4 border border-[#FFD700]/20 rounded-xl"></div>
                    <div class="relative z-10 my-auto w-full min-w-0 px-[2cqw] flex flex-col items-center gap-[1.2cqw]">
                        <h2 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] break-words [overflow-wrap:anywhere]" style="font-size:${cqw}cqw">
                            ${this.renderTitleHighlightHtml(s, 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF3B0] to-[#FFD700]')}
                        </h2>
                        <p class="text-white w-full min-w-0 font-bold tracking-widest uppercase break-words [overflow-wrap:anywhere] drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)]" style="font-size:${verseCqw}cqw">${this.escapeHtml(s.verse)}</p>
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 flex justify-center">
                        <div class="bg-[#132A4A]/90 border-t-2 border-[#FFD700]/50 px-[2.6cqw] py-[0.8cqw] max-w-full rounded-lg shadow-xl text-center">
                            <p class="text-slate-200 max-w-full break-words [overflow-wrap:anywhere] font-semibold tracking-wide" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'point') {
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            const hl = this.computePointHighlight(words, this.getHighlights(s));
            const line1 = words.slice(0, hl.brIndex + 1);
            const line2 = words.slice(hl.brIndex + 1);
            const hlClass = 'text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF3B0] to-[#FFD700]';
            const renderWords = (arr, offset) => arr.map((w, i) =>
                hl.hlIdx.has(offset + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : this.escapeHtml(w)
            ).join(' ');
            // Rules-based sizing: estimate how many lines the point wraps to,
            // then pick the title font size from a tier table. Point text is
            // much bigger than the verse tiers (min & max).
            const lines = (line1.length ? 1 : 0) + (line2.length ? 1 : 0);
            const charsPerLine = Math.max(8, Math.floor(96 / (0.62 * 7.5))); // ~20 chars at mid size
            const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length, 1);
            const estLines = Math.max(lines, Math.ceil(longestLine / charsPerLine));
            const TITLE_FONT_TIERS = [
                { maxLines: 1, size: 10.5 }, // 1-line point -> biggest
                { maxLines: 2, size: 9.0 },  // 2-line point -> big
                { maxLines: 3, size: 7.5 },  // 3-line point -> medium
                { maxLines: Infinity, size: 6.5 }, // 4+ lines -> smallest (still much bigger than verse)
            ];
            const cqw = TITLE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const badgeCqw = Math.round(cqw * 0.34 * 10) / 10;
            const descCqw = Math.round(cqw * 0.26 * 10) / 10;
            return `
                <div class="relative w-full cq-container aspect-video bg-[#0B192C] border-[6px] border-[#FFD700]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:p-8 text-center">
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-[#0B192C] to-[#050C16]"></div>
                    <div class="absolute inset-4 border border-[#FFD700]/20 rounded-xl"></div>
                    <div class="relative z-10 flex justify-center">
                        <span class="bg-[#FFD700] text-[#0B192C] inline-block font-black tracking-[0.25em] uppercase px-[2.6cqw] py-[0.45cqw] rounded-full shadow-lg break-words" style="font-size:${badgeCqw}cqw">${this.escapeHtml(s.badge || 'POINT')}</span>
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 px-[2cqw] flex flex-col items-center gap-[1.2cqw]">
                        <h2 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] break-words [overflow-wrap:anywhere]" style="font-size:${cqw}cqw">
                            ${renderWords(line1, 0)}${line1.length && line2.length ? '<br />' : ''}${renderWords(line2, line1.length)}
                        </h2>
                    </div>
                    ${s.desc ? `
                    <div class="relative z-10 flex justify-center">
                        <div class="bg-[#132A4A]/90 border-t-2 border-[#FFD700]/50 px-[2.6cqw] py-[0.8cqw] max-w-full rounded-lg shadow-xl text-center">
                            <p class="text-slate-200 max-w-full break-words [overflow-wrap:anywhere] font-semibold tracking-wide" style="font-size:${descCqw}cqw">${this.escapeHtml(s.desc)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'verse') {
            // Rules-based sizing: estimate how many lines the verse wraps to,
            // then pick the font size from a tier table so longer verses tier
            // down gently and still fit. (2-line -> big, 3-line -> current size,
            // 4-line -> smaller, 5+ lines -> smallest)
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 3.4))); // ~48 chars at current size
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const BODY_FONT_TIERS = [
                { maxLines: 2, size: 6.0 }, // 2-line verse -> big
                { maxLines: 3, size: 5.0 }, // 3-line verse -> current size
                { maxLines: 4, size: 4.2 }, // 4-line verse -> smaller
                { maxLines: Infinity, size: 3.6 }, // 5+ lines -> smallest
            ];
            const bodyCqw = BODY_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.62) * 10) / 10;
            const versionCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="relative w-full cq-container aspect-video bg-[#0B192C] border-[6px] border-[#FFD700]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:p-8 text-center">
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-[#0B192C] to-[#050C16]"></div>
                    <div class="absolute inset-4 border border-[#FFD700]/20 rounded-xl"></div>
                    <div class="relative z-10 flex justify-center pt-[2cqw]">
                        <div class="bg-[#132A4A] border-l-4 border-[#FFD700] px-[2.2cqw] py-[0.6cqw] rounded-r-lg shadow-lg max-w-full">
                            <h3 class="text-[#FFD700] w-full min-w-0 font-black tracking-[0.2em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</h3>
                        </div>
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 flex-1 px-[2cqw] py-[2cqw] flex flex-col items-center justify-center">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] break-words [overflow-wrap:anywhere]" style="font-size:${bodyCqw}cqw">&quot;${this.escapeHtml(s.text)}&quot;</p>
                    </div>
                    ${s.version ? `
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <span class="text-[#FFD700]/70 w-full min-w-0 max-w-full font-bold tracking-widest uppercase break-words [overflow-wrap:anywhere]" style="font-size:${versionCqw}cqw">${this.escapeHtml(s.version)}</span>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'message') {
            // Rules-based sizing: estimate how many lines the message wraps to,
            // then tier down gradually. Min = 4.0, Max = 6.6.
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 5.5))); // ~30 chars at mid size
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 6.6 }, // 2-line message -> max size
                { maxLines: 3, size: 5.6 }, // 3-line message -> big
                { maxLines: 4, size: 4.8 }, // 4-line message -> medium
                { maxLines: Infinity, size: 4.0 }, // 5+ lines -> min size
            ];
            const bodyCqw = MESSAGE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.5) * 10) / 10;
            const footerCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="relative w-full cq-container aspect-video bg-[#0B192C] border-[6px] border-[#FFD700]/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 md:p-8 text-center">
                    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/50 via-[#0B192C] to-[#050C16]"></div>
                    <div class="absolute inset-4 border border-[#FFD700]/20 rounded-xl"></div>
                    ${s.ref ? `
                    <div class="relative z-10 flex justify-center pt-[2cqw]">
                        <span class="text-[#FFD700] w-full min-w-0 max-w-full font-bold tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</span>
                    </div>` : ''}
                    <div class="relative z-10 my-auto w-full min-w-0 flex-1 px-[2cqw] py-[2cqw] flex flex-col items-center justify-center">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] break-words [overflow-wrap:anywhere]" style="font-size:${bodyCqw}cqw">${this.highlightPhrasesHtml(s.text, this.getHighlights(s))}</p>
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <span class="text-[#FFD700]/70 w-full min-w-0 max-w-full font-bold tracking-widest uppercase break-words [overflow-wrap:anywhere]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</span>
                    </div>` : ''}
                </div>`;
        }
        return `
            <div class="${base}">
                <span class="text-amber-400 font-bold text-xs md:text-sm mb-4 tracking-wide">${this.escapeHtml(s.ref)}</span>
                <p class="text-white/90 italic text-base md:text-xl max-w-full break-words">“${this.escapeHtml(s.text)}”</p>
                <span class="mt-4 text-amber-400/80 text-[10px] md:text-xs tracking-widest">${this.escapeHtml(s.version)}</span>
            </div>`;
    }

    // ============================================================
    // Midnight Aurora - modern layout preview
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (left-aligned split layout, gradient sweep, square chips and a
    // full-width footer strip) - but the font-size rules are identical
    // to the classic templates: the exact same cqw tier tables below.
    // ============================================================
    renderSlideVisualModern(s) {
        const base = 'relative w-full cq-container aspect-video bg-[#0D1117] border-[6px] border-[#22D3EE]/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between font-sans';
        const accentBar = '<div class="absolute left-0 top-0 bottom-0 w-[1.1cqw] bg-gradient-to-b from-[#22D3EE] to-[#A78BFA]"></div>';
        const sweep = '<div class="absolute inset-0 bg-[linear-gradient(125deg,_rgba(34,211,238,0.16)_0%,_rgba(167,139,250,0.10)_45%,_rgba(13,17,23,0)_72%)]"></div>';
        const topRightBlock = '<div class="absolute -right-16 -top-20 w-72 h-72 rotate-12 bg-gradient-to-br from-[#22D3EE]/25 to-[#A78BFA]/25 rounded-3xl"></div>';
        const diamond = '<div class="absolute -left-10 bottom-24 w-36 h-36 rotate-45 border-2 border-[#22D3EE]/25 rounded-lg"></div>';

        if (s.type === 'title') {
            // Same title split + auto-fit rules as the classic templates (min 5.5cqw / max 10.5cqw, headline +8pt).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            let line1 = '';
            let line2 = s.title || '';
            if (words.length >= 3) {
                line1 = words.slice(0, -2).join(' ');
                line2 = words.slice(-2).join(' ');
            } else if (words.length === 2) {
                line1 = words[0];
                line2 = words[1];
            }
            const chars = Math.max(line1.length, line2.length, 1);
            const lines = (line1 ? 1 : 0) + 1;
            const heightCap = (0.6 * 56.25) / (lines * 1.15 + 1.1);
            const widthCap = 132 / chars;
            const baseCqw = Math.min(8.5, Math.max(3.5, Math.min(heightCap, widthCap)));
            const cqw = Math.min(10.5, Math.max(5.5, baseCqw + 2.0)); // title headline +8pt
            const verseCqw = Math.round(baseCqw * 0.42 * 10) / 10;
            const footerCqw = Math.round(baseCqw * 0.26 * 10) / 10;
            return `
                <div class="${base}">
                    ${sweep}
                    ${topRightBlock}
                    ${diamond}
                    ${accentBar}
                    <div class="relative z-10 my-auto w-full min-w-0 pl-[6.5cqw] pr-[5cqw] flex flex-col items-start gap-[1.6cqw]">
                        <h1 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_24px_rgba(2,6,23,0.75)] break-words [overflow-wrap:anywhere] text-left" style="font-size:${cqw}cqw">
                            ${this.renderTitleHighlightHtml(s, 'text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#7DD3FC] to-[#A78BFA]')}
                        </h1>
                        ${s.verse ? `<p class="text-[#A78BFA] w-full min-w-0 font-bold tracking-[0.35em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${verseCqw}cqw">${this.escapeHtml(s.verse)}</p>` : ''}
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 w-full border-t-2 border-[#22D3EE]/40 bg-[#1F2937]/80 pl-[6.5cqw] pr-[4.5cqw] py-[1.5cqw]">
                        <p class="text-slate-200 w-full min-w-0 font-bold tracking-[0.2em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }

        if (s.type === 'point') {

            // Same highlight split + title tier rules as the classic templates (min 6.5cqw / max 10.5cqw).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            const hl = this.computePointHighlight(words, this.getHighlights(s));
            const line1 = words.slice(0, hl.brIndex + 1);
            const line2 = words.slice(hl.brIndex + 1);
            const hlClass = 'text-transparent bg-clip-text bg-gradient-to-r from-[#22D3EE] via-[#7DD3FC] to-[#A78BFA]';
            const renderWords = (arr, offset) => arr.map((w, i) =>
                hl.hlIdx.has(offset + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : this.escapeHtml(w)
            ).join(' ');
            const lines = (line1.length ? 1 : 0) + (line2.length ? 1 : 0);
            const charsPerLine = Math.max(8, Math.floor(96 / (0.62 * 7.5)));
            const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length, 1);
            const estLines = Math.max(lines, Math.ceil(longestLine / charsPerLine));
            const TITLE_FONT_TIERS = [
                { maxLines: 1, size: 10.5 },
                { maxLines: 2, size: 9.0 },
                { maxLines: 3, size: 7.5 },
                { maxLines: Infinity, size: 6.5 }
            ];
            const cqw = TITLE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const badgeCqw = Math.round(cqw * 0.34 * 10) / 10;
            const descCqw = Math.round(cqw * 0.26 * 10) / 10;
            return `
                <div class="${base}">
                    ${sweep}
                    ${topRightBlock}
                    ${diamond}
                    ${accentBar}
                    <div class="relative z-10 flex items-center justify-between pt-[2.6cqw] pl-[6.5cqw] pr-[4.5cqw]">
                        <span class="inline-flex items-center bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] text-[#0D1117] font-black tracking-[0.25em] uppercase px-[2.2cqw] py-[0.7cqw] rounded-sm shadow-lg" style="font-size:${badgeCqw}cqw">${this.escapeHtml(s.badge || 'POINT')}</span>
                        <span class="w-[1.8cqw] h-[1.8cqw] rotate-45 border-2 border-[#22D3EE]/50"></span>
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 pl-[6.5cqw] pr-[5cqw]">
                        <h2 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_24px_rgba(2,6,23,0.75)] break-words [overflow-wrap:anywhere] text-left" style="font-size:${cqw}cqw">
                            ${renderWords(line1, 0)}${line1.length && line2.length ? '<br />' : ''}${renderWords(line2, line1.length)}
                        </h2>
                    </div>
                    ${s.desc ? `
                    <div class="relative z-10 w-full border-t-2 border-[#22D3EE]/40 bg-[#1F2937]/80 pl-[6.5cqw] pr-[4.5cqw] py-[1.5cqw]">
                        <div class="flex items-center gap-[2cqw]">
                            <span class="w-[0.5cqw] h-[2.8cqw] bg-gradient-to-b from-[#22D3EE] to-[#A78BFA] rounded-sm"></span>
                            <p class="text-slate-200 w-full min-w-0 font-bold tracking-wide break-words [overflow-wrap:anywhere]" style="font-size:${descCqw}cqw">${this.escapeHtml(s.desc)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }

        if (s.type === 'verse') {
            // Same verse tier rules as the classic templates (min 3.6cqw / max 6.0cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 3.4)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const BODY_FONT_TIERS = [
                { maxLines: 2, size: 6.0 },
                { maxLines: 3, size: 5.0 },
                { maxLines: 4, size: 4.2 },
                { maxLines: Infinity, size: 3.6 }
            ];
            const bodyCqw = BODY_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.62) * 10) / 10;
            const versionCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="${base}">
                    ${sweep}
                    ${topRightBlock}
                    ${diamond}
                    ${accentBar}
                    <div class="relative z-10 pt-[2.6cqw] pl-[6.5cqw] pr-[4.5cqw]">
                        ${s.ref ? `
                        <span class="inline-flex items-center gap-[1.2cqw] bg-[#1F2937] border-l-4 border-[#22D3EE] px-[2.2cqw] py-[0.7cqw] rounded-sm shadow-lg text-[#7DD3FC] font-black tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</span>` : ''}
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 pl-[6.5cqw] pr-[5cqw]">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_24px_rgba(2,6,23,0.75)] break-words [overflow-wrap:anywhere] text-left" style="font-size:${bodyCqw}cqw">&quot;${this.escapeHtml(s.text)}&quot;</p>
                    </div>
                    ${s.version ? `
                    <div class="relative z-10 w-full border-t-2 border-[#22D3EE]/40 bg-[#1F2937]/80 pl-[6.5cqw] pr-[4.5cqw] py-[1.5cqw]">
                        <p class="text-[#7DD3FC] w-full min-w-0 font-bold tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${versionCqw}cqw">${this.escapeHtml(s.version)}</p>
                    </div>` : ''}
                </div>`;
        }

        if (s.type === 'message') {

            // Same message tier rules as the classic templates (min 4.0cqw / max 6.6cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 5.5)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 6.6 },
                { maxLines: 3, size: 5.6 },
                { maxLines: 4, size: 4.8 },
                { maxLines: Infinity, size: 4.0 }
            ];
            const bodyCqw = MESSAGE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.5) * 10) / 10;
            const footerCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="${base}">
                    ${sweep}
                    ${topRightBlock}
                    ${diamond}
                    ${accentBar}
                    <div class="relative z-10 pt-[2.6cqw] pl-[6.5cqw] pr-[4.5cqw]">
                        ${s.ref ? `
                        <span class="inline-flex items-center gap-[1.2cqw] bg-[#1F2937] border-l-4 border-[#22D3EE] px-[2.2cqw] py-[0.7cqw] rounded-sm shadow-lg text-[#7DD3FC] font-black tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</span>` : ''}
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 pl-[6.5cqw] pr-[5cqw]">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_24px_rgba(2,6,23,0.75)] break-words [overflow-wrap:anywhere] text-left" style="font-size:${bodyCqw}cqw">${this.highlightPhrasesHtml(s.text, this.getHighlights(s))}</p>
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 w-full border-t-2 border-[#22D3EE]/40 bg-[#1F2937]/80 pl-[6.5cqw] pr-[4.5cqw] py-[1.5cqw]">
                        <p class="text-[#7DD3FC] w-full min-w-0 font-bold tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }

        return `
            <div class="${base}">
                ${sweep}
                ${accentBar}
                <div class="relative z-10 p-[4cqw] text-left">
                    <p class="text-slate-200 font-semibold" style="font-size:4cqw">${this.escapeHtml(s.text || s.ref || s.title || '')}</p>
                </div>
            </div>`;
    }


    // ============================================================
    // Forest Chapel - ornate centered layout preview
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (centered chapel layout with ornamental gold dividers), but the
    // font-size rules are identical to the classic templates: the exact
    // same cqw tier tables / min-max bounds below.
    // ============================================================
    renderSlideVisualChapel(s) {
        const base = 'relative w-full cq-container aspect-video bg-[#0E2A1E] border-[6px] border-[#D9B36C]/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between font-sans';
        const glow = '<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1B4D36_0%,_transparent_72%)] opacity-70"></div>';
        const frame = '<div class="absolute inset-4 border border-[#D9B36C]/25 rounded-xl pointer-events-none"></div>';
        const corners = '<div class="absolute inset-0 pointer-events-none">' +
            '<span class="absolute left-[1.5cqw] top-[1.5cqw] w-[4.5cqw] h-[0.3cqw] bg-[#D9B36C]"></span>' +
            '<span class="absolute right-[1.5cqw] top-[1.5cqw] w-[4.5cqw] h-[0.3cqw] bg-[#D9B36C]"></span>' +
            '<span class="absolute left-[1.5cqw] bottom-[1.5cqw] w-[4.5cqw] h-[0.3cqw] bg-[#D9B36C]"></span>' +
            '<span class="absolute right-[1.5cqw] bottom-[1.5cqw] w-[4.5cqw] h-[0.3cqw] bg-[#D9B36C]"></span>' +
            '</div>';
        const divider = '<div class="relative z-10 flex items-center justify-center gap-[1.4cqw] pt-[2.6cqw]">' +
            '<span class="w-[14cqw] h-[0.28cqw] bg-[#D9B36C]/60"></span>' +
            '<span class="w-[1.1cqw] h-[1.1cqw] rotate-45 bg-[#D9B36C]"></span>' +
            '<span class="w-[14cqw] h-[0.28cqw] bg-[#D9B36C]/60"></span>' +
            '</div>';

        if (s.type === 'title') {
            // Same title split + auto-fit rules as the classic templates (min 5.5cqw / max 10.5cqw, headline +8pt).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            let line1 = '';
            let line2 = s.title || '';
            if (words.length >= 3) {
                line1 = words.slice(0, -2).join(' ');
                line2 = words.slice(-2).join(' ');
            } else if (words.length === 2) {
                line1 = words[0];
                line2 = words[1];
            }
            const chars = Math.max(line1.length, line2.length, 1);
            const lines = (line1 ? 1 : 0) + 1;
            const heightCap = (0.6 * 56.25) / (lines * 1.15 + 1.1);
            const widthCap = 132 / chars;
            const baseCqw = Math.min(8.5, Math.max(3.5, Math.min(heightCap, widthCap)));
            const cqw = Math.min(10.5, Math.max(5.5, baseCqw + 2.0)); // title headline +8pt
            const verseCqw = Math.round(baseCqw * 0.42 * 10) / 10;
            const footerCqw = Math.round(baseCqw * 0.26 * 10) / 10;
            return `
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    ${divider}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw] flex flex-col items-center gap-[1.4cqw]">
                        <h1 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_20px_rgba(6,20,14,0.8)] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${this.renderTitleHighlightHtml(s, 'text-transparent bg-clip-text bg-gradient-to-r from-[#D9B36C] via-[#F4E4BC] to-[#D9B36C]')}
                        </h1>
                        ${s.verse ? `<p class="text-[#D9B36C] w-full min-w-0 font-bold text-center tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere] drop-shadow-[0_5px_10px_rgba(6,20,14,0.8)]" style="font-size:${verseCqw}cqw">${this.escapeHtml(s.verse)}</p>` : ''}
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 flex flex-col items-center gap-[0.6cqw] pb-[2cqw]">
                        <span class="w-[1.1cqw] h-[1.1cqw] rotate-45 bg-[#D9B36C]"></span>
                        <p class="text-slate-200 w-full min-w-0 font-semibold tracking-wide break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'point') {
            // Same highlight split + title tier rules as the classic templates (min 6.5cqw / max 10.5cqw).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            const hl = this.computePointHighlight(words, this.getHighlights(s));
            const line1 = words.slice(0, hl.brIndex + 1);
            const line2 = words.slice(hl.brIndex + 1);
            const hlClass = 'text-transparent bg-clip-text bg-gradient-to-r from-[#D9B36C] via-[#F4E4BC] to-[#D9B36C]';
            const renderWords = (arr, offset) => arr.map((w, i) =>
                hl.hlIdx.has(offset + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : this.escapeHtml(w)
            ).join(' ');
            const lines = (line1.length ? 1 : 0) + (line2.length ? 1 : 0);
            const charsPerLine = Math.max(8, Math.floor(96 / (0.62 * 7.5)));
            const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length, 1);
            const estLines = Math.max(lines, Math.ceil(longestLine / charsPerLine));
            const TITLE_FONT_TIERS = [
                { maxLines: 1, size: 10.5 },
                { maxLines: 2, size: 9.0 },
                { maxLines: 3, size: 7.5 },
                { maxLines: Infinity, size: 6.5 }
            ];
            const cqw = TITLE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const badgeCqw = Math.round(cqw * 0.34 * 10) / 10;
            const descCqw = Math.round(cqw * 0.26 * 10) / 10;
            return `
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    <div class="relative z-10 flex justify-center pt-[2.6cqw]">
                        <span class="inline-flex items-center bg-[#D9B36C] text-[#0E2A1E] font-black tracking-[0.25em] uppercase px-[2.4cqw] py-[0.8cqw] rounded-full shadow-lg" style="font-size:${badgeCqw}cqw">${this.escapeHtml(s.badge || 'POINT')}</span>
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <h2 class="text-white w-full min-w-0 font-black tracking-tight leading-[1.12] drop-shadow-[0_10px_20px_rgba(6,20,14,0.8)] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${renderWords(line1, 0)}${line1.length && line2.length ? '<br />' : ''}${renderWords(line2, line1.length)}
                        </h2>
                    </div>
                    ${s.desc ? `
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <div class="flex items-center gap-[2cqw] bg-[#1A3A2A]/90 border border-[#D9B36C]/50 px-[2.6cqw] py-[0.9cqw] rounded-lg shadow-xl">
                            <span class="w-[0.5cqw] h-[2.6cqw] bg-gradient-to-b from-[#D9B36C] to-[#F4E4BC] rounded-sm"></span>
                            <p class="text-slate-200 w-full min-w-0 font-bold tracking-wide break-words [overflow-wrap:anywhere]" style="font-size:${descCqw}cqw">${this.escapeHtml(s.desc)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'verse') {
            // Same verse tier rules as the classic templates (min 3.6cqw / max 6.0cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 3.4)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const BODY_FONT_TIERS = [
                { maxLines: 2, size: 6.0 },
                { maxLines: 3, size: 5.0 },
                { maxLines: 4, size: 4.2 },
                { maxLines: Infinity, size: 3.6 }
            ];
            const bodyCqw = BODY_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.62) * 10) / 10;
            const versionCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    <div class="relative z-10 flex justify-center pt-[2.6cqw]">
                        ${s.ref ? `
                        <span class="inline-flex items-center bg-[#1A3A2A] border-l-4 border-[#D9B36C] px-[2.2cqw] py-[0.8cqw] rounded-r-lg shadow-lg text-[#D9B36C] font-black tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</span>` : ''}
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_20px_rgba(6,20,14,0.8)] break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">&quot;${this.escapeHtml(s.text)}&quot;</p>
                    </div>
                    ${s.version ? `
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <p class="text-[#D9B36C] w-full min-w-0 font-bold tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere] text-center" style="font-size:${versionCqw}cqw">${this.escapeHtml(s.version)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'message') {
            // Same message tier rules as the classic templates (min 4.0cqw / max 6.6cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 5.5)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 6.6 },
                { maxLines: 3, size: 5.6 },
                { maxLines: 4, size: 4.8 },
                { maxLines: Infinity, size: 4.0 }
            ];
            const bodyCqw = MESSAGE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.5) * 10) / 10;
            const footerCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    <div class="relative z-10 flex justify-center pt-[2.6cqw]">
                        ${s.ref ? `
                        <span class="inline-flex items-center bg-[#1A3A2A] border-l-4 border-[#D9B36C] px-[2.2cqw] py-[0.7cqw] rounded-r-lg shadow-lg text-[#D9B36C] font-black tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${refCqw}cqw">${this.escapeHtml(s.ref)}</span>` : ''}
                    </div>
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-white w-full min-w-0 font-bold leading-relaxed drop-shadow-[0_10px_20px_rgba(6,20,14,0.8)] break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">${this.highlightPhrasesHtml(s.text, this.getHighlights(s))}</p>
                    </div>
                    ${s.footer ? `
                    <div class="relative z-10 w-full border-t-2 border-[#D9B36C]/40 bg-[#1A3A2A]/80 py-[1.5cqw]">
                        <p class="text-[#D9B36C] w-full min-w-0 font-bold tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }

        return `
            <div class="${base}">
                ${glow}
                ${frame}
                ${corners}
                <div class="relative z-10 p-[4cqw] text-center">
                    <p class="text-slate-200 font-semibold" style="font-size:4cqw">${this.escapeHtml(s.text || s.ref || s.title || '')}</p>
                </div>
            </div>`;
    }
// ============================================================
    // Lilac Grace - soft light-purple layout PREVIEW
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (light lavender "cloud" layout, graceful Palatino serif), but the
    // font-size rules are identical to the classic templates: the exact
    // same cqw tier tables / min-max bounds / +2.0 headline boost below.
    // ============================================================
    renderSlideVisualLilac(s) {
        const base = 'relative w-full cq-container aspect-video bg-[#F3EEFC] border-[6px] border-[#7C3AED]/60 rounded-[1.4cqw] shadow-2xl overflow-hidden flex flex-col justify-between font-[\'Palatino\',\'Georgia\',serif]';
        const glow = ''; // Center glow removed from lilac slides
        const frame = '<div class="absolute inset-4 border border-[#A78BFA]/25 rounded-[1.1cqw] pointer-events-none"></div>';
        const corners = '<div class="absolute inset-0 pointer-events-none">' +
            '<span class="absolute left-[1.5cqw] top-[1.5cqw] w-[0.9cqw] h-[0.9cqw] rounded-full bg-[#C4B5FD]"></span>' +
            '<span class="absolute right-[1.5cqw] top-[1.5cqw] w-[0.9cqw] h-[0.9cqw] rounded-full bg-[#C4B5FD]"></span>' +
            '<span class="absolute left-[1.5cqw] bottom-[1.5cqw] w-[0.9cqw] h-[0.9cqw] rounded-full bg-[#C4B5FD]"></span>' +
            '<span class="absolute right-[1.5cqw] bottom-[1.5cqw] w-[0.9cqw] h-[0.9cqw] rounded-full bg-[#C4B5FD]"></span>' +
            '</div>';
        const seriesChip = (label) => `<div class="relative z-10 flex justify-center pt-[2.2cqw]"><span class="inline-flex items-center bg-white/75 border border-[#A78BFA]/40 text-[#7C3AED] font-black tracking-[0.25em] uppercase px-[2.6cqw] py-[0.8cqw] rounded-full shadow-md" style="font-size:${Math.round(label ? 3.2 : 0)}cqw">${this.escapeHtml(label || '')}</span></div>`;

        if (s.type === 'title') {
            // Same title split + auto-fit rules as the classic templates (min 5.5cqw / max 10.5cqw, headline +8pt).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            let line1 = '';
            let line2 = s.title || '';
            if (words.length >= 3) {
                line1 = words.slice(0, -2).join(' ');
                line2 = words.slice(-2).join(' ');
            } else if (words.length === 2) {
                line1 = words[0];
                line2 = words[1];
            }
            const chars = Math.max(line1.length, line2.length, 1);
            const lines = (line1 ? 1 : 0) + 1;
            const heightCap = (0.6 * 56.25) / (lines * 1.15 + 1.1);
            const widthCap = 132 / chars;
            const baseCqw = Math.min(8.5, Math.max(3.5, Math.min(heightCap, widthCap)));
            const cqw = Math.min(10.5, Math.max(5.5, baseCqw + 2.0)); // title headline +8pt
            const verseCqw = Math.round(baseCqw * 0.42 * 10) / 10;
            const footerCqw = Math.round(baseCqw * 0.26 * 10) / 10;
            return `\
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw] flex flex-col items-center gap-[1.4cqw]">
                        <h1 class="text-[#2E1065] w-full min-w-0 font-black tracking-tight leading-[1.12] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${this.renderTitleHighlightHtml(s, 'text-[#C0522E]')}
                        </h1>
                        ${s.verse ? `<p class="text-[#7C3AED] w-full min-w-0 font-bold text-center tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${verseCqw}cqw">${this.escapeHtml(s.verse)}</p>` : ''}
                    </div>
                                        ${s.footer ? `\
                    <div class="relative z-10 flex flex-col items-center gap-[0.6cqw] pb-[2cqw]">
                        <span class="w-[1.1cqw] h-[1.1cqw] rotate-45 bg-[#A78BFA]"></span>
                        <p class="text-[#2E1065] w-full min-w-0 font-semibold tracking-wide break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'point') {
            // Same highlight split + title tier rules as the classic templates (min 6.5cqw / max 10.5cqw).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            const hl = this.computePointHighlight(words, this.getHighlights(s));
            const line1 = words.slice(0, hl.brIndex + 1);
            const line2 = words.slice(hl.brIndex + 1);
            const hlClass = 'text-[#C0522E]';
            const renderWords = (arr, offset) => arr.map((w, i) =>
                hl.hlIdx.has(offset + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : `<span class="text-[#2E1065]">${this.escapeHtml(w)}</span>`
            ).join(' ');
            const lines = (line1.length ? 1 : 0) + (line2.length ? 1 : 0);
            const charsPerLine = Math.max(8, Math.floor(96 / (0.62 * 7.5)));
            const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length, 1);
            const estLines = Math.max(lines, Math.ceil(longestLine / charsPerLine));
            const TITLE_FONT_TIERS = [
                { maxLines: 1, size: 10.5 },
                { maxLines: 2, size: 9.0 },
                { maxLines: 3, size: 7.5 },
                { maxLines: Infinity, size: 6.5 }
            ];
            const cqw = TITLE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const badgeCqw = Math.round(cqw * 0.34 * 10) / 10;
            const descCqw = Math.round(cqw * 0.26 * 10) / 10;
            return `\
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    ${seriesChip(s.badge || 'POINT')}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <h2 class="text-[#2E1065] w-full min-w-0 font-black tracking-tight leading-[1.12] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${renderWords(line1, 0)}${line1.length && line2.length ? '<br />' : ''}${renderWords(line2, line1.length)}
                        </h2>
                        ${s.badge ? `<p class="text-[#7C3AED] w-full min-w-0 font-bold text-center tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${badgeCqw}cqw">${this.escapeHtml(s.badge)}</p>` : ''}
                    </div>
                    ${s.desc ? `\
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <div class="flex items-center gap-[2cqw] bg-white/80 border border-[#A78BFA]/40 px-[2.6cqw] py-[0.9cqw] rounded-[1cqw] shadow-md">
                            <span class="w-[0.6cqw] h-[2.2cqw] bg-[#C0522E] rounded-full"></span>
                            <p class="text-[#2E1065] w-full min-w-0 font-bold tracking-wide break-words [overflow-wrap:anywhere]" style="font-size:${descCqw}cqw">${this.escapeHtml(s.desc)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'verse') {
            // Same verse tier rules as the classic templates (min 3.6cqw / max 6.0cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 3.4)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const BODY_FONT_TIERS = [
                { maxLines: 2, size: 6.0 },
                { maxLines: 3, size: 5.0 },
                { maxLines: 4, size: 4.2 },
                { maxLines: Infinity, size: 3.6 }
            ];
            const bodyCqw = BODY_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.62) * 10) / 10;
            const versionCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `\
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    ${s.ref ? seriesChip(s.ref) : ''}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-[#2E1065] w-full min-w-0 font-bold leading-relaxed break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">&quot;${this.escapeHtml(s.text)}&quot;</p>
                    </div>
                                        ${s.version ? `\
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <p class="text-[#7C3AED] w-full min-w-0 font-bold tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere] text-center" style="font-size:${versionCqw}cqw">${this.escapeHtml(s.version)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'message') {
            // Same message tier rules as the classic templates (min 4.0cqw / max 6.6cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 5.5)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 6.6 },
                { maxLines: 3, size: 5.6 },
                { maxLines: 4, size: 4.8 },
                { maxLines: Infinity, size: 4.0 }
            ];
            const bodyCqw = MESSAGE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.5) * 10) / 10;
            const footerCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `\
                <div class="${base}">
                    ${glow}
                    ${frame}
                    ${corners}
                    ${s.ref ? seriesChip(s.ref) : ''}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-[#2E1065] w-full min-w-0 font-bold leading-relaxed break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">${this.highlightPhrasesHtml(s.text, this.getHighlights(s), 'text-[#C0522E]')}</p>
                    </div>
                    ${s.footer ? `\
                    <div class="relative z-10 w-full border-t-2 border-[#A78BFA]/30 bg-white/70 py-[1.5cqw]">
                        <p class="text-[#7C3AED] w-full min-w-0 font-bold tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }

        return `\
            <div class="${base}">
                ${glow}
                ${frame}
                ${corners}
                <div class="relative z-10 p-[4cqw] text-center">
                    <p class="text-[#2E1065] font-semibold" style="font-size:4cqw">${this.escapeHtml(s.text || s.ref || s.title || '')}</p>
                </div>
            </div>`;
    }





// ============================================================
    // Rose Atelier - warm ivory & rose editorial layout PREVIEW
    // A different DESIGN / COLOR / FONT STYLE / FORMAT / ORGANIZATION
    // (left rose accent bar, hairline frame, squared chips and diamond
    // flourishes on a warm ivory palette), but the font-size rules are
    // identical to the classic templates: the exact same cqw tier tables /
    // min-max bounds / +2.0 headline boost below.
    // ============================================================
    renderSlideVisualRose(s) {
        const base = 'relative w-full cq-container aspect-video bg-[#FBF5EF] border-[6px] border-[#A64A52]/60 rounded-[1.4cqw] shadow-2xl overflow-hidden flex flex-col justify-between font-[\'Georgia\',\'Times New Roman\',serif]';
        const glow = ''; // No glow on rose slides
        const leftBar = '<div class="absolute left-0 top-0 bottom-0 w-[1cqw] bg-gradient-to-b from-[#A64A52] to-[#E2A9B0]"></div>';
        const frame = '<div class="absolute inset-4 border border-[#C98D94]/35 rounded-[1.1cqw] pointer-events-none"></div>';
        const corners = '<div class="absolute inset-0 pointer-events-none">' +
            '<span class="absolute left-[1.5cqw] top-[1.5cqw] w-[0.7cqw] h-[0.7cqw] rotate-45 bg-[#A64A52]"></span>' +
            '<span class="absolute right-[1.5cqw] top-[1.5cqw] w-[0.7cqw] h-[0.7cqw] rotate-45 bg-[#A64A52]"></span>' +
            '<span class="absolute left-[1.5cqw] bottom-[1.5cqw] w-[0.7cqw] h-[0.7cqw] rotate-45 bg-[#A64A52]"></span>' +
            '<span class="absolute right-[1.5cqw] bottom-[1.5cqw] w-[0.7cqw] h-[0.7cqw] rotate-45 bg-[#A64A52]"></span>' +
            '</div>';
        const chip = (label) => `<div class="relative z-10 flex justify-center pt-[2.2cqw]"><span class="inline-flex items-center bg-white/80 border border-[#A64A52]/45 text-[#A64A52] font-bold tracking-[0.25em] uppercase px-[2.6cqw] py-[0.8cqw] rounded-sm shadow-sm" style="font-size:${Math.round(label ? 3.2 : 0)}cqw">${this.escapeHtml(label || '')}</span></div>`;
        const diamond = '<span class="w-[0.8cqw] h-[0.8cqw] rotate-45 bg-[#A64A52]/80"></span>';

        if (s.type === 'title') {
            // Same title split + auto-fit rules as the classic templates (min 5.5cqw / max 10.5cqw, headline +8pt).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            let line1 = '';
            let line2 = s.title || '';
            if (words.length >= 3) {
                line1 = words.slice(0, -2).join(' ');
                line2 = words.slice(-2).join(' ');
            } else if (words.length === 2) {
                line1 = words[0];
                line2 = words[1];
            }
            const chars = Math.max(line1.length, line2.length, 1);
            const lines = (line1 ? 1 : 0) + 1;
            const heightCap = (0.6 * 56.25) / (lines * 1.15 + 1.1);
            const widthCap = 132 / chars;
            const baseCqw = Math.min(8.5, Math.max(3.5, Math.min(heightCap, widthCap)));
            const cqw = Math.min(10.5, Math.max(5.5, baseCqw + 2.0)); // title headline +8pt
            const verseCqw = Math.round(baseCqw * 0.42 * 10) / 10;
            const footerCqw = Math.round(baseCqw * 0.26 * 10) / 10;
            return `\
                <div class="${base}">
                    ${leftBar}
                    ${frame}
                    ${corners}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw] flex flex-col items-center gap-[1.4cqw]">
                        <h1 class="text-[#3A2328] w-full min-w-0 font-black tracking-tight leading-[1.12] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${this.renderTitleHighlightHtml(s, 'text-[#A64A52]')}
                        </h1>
                        ${s.verse ? `<p class="text-[#A64A52] w-full min-w-0 font-bold text-center tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${verseCqw}cqw">${this.escapeHtml(s.verse)}</p>` : ''}
                    </div>
                    ${s.footer ? `\
                    <div class="relative z-10 flex flex-col items-center gap-[0.6cqw] pb-[2cqw]">
                        ${diamond}
                        <p class="text-[#3A2328] w-full min-w-0 font-semibold tracking-wide break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'point') {
            // Same highlight split + title tier rules as the classic templates (min 6.5cqw / max 10.5cqw).
            const words = String(s.title || '').trim().split(/\s+/).filter(Boolean);
            const hl = this.computePointHighlight(words, this.getHighlights(s));
            const line1 = words.slice(0, hl.brIndex + 1);
            const line2 = words.slice(hl.brIndex + 1);
            const hlClass = 'text-[#A64A52]';
            const renderWords = (arr, offset) => arr.map((w, i) =>
                hl.hlIdx.has(offset + i) ? `<span class="${hlClass}">${this.escapeHtml(w)}</span>` : `<span class="text-[#3A2328]">${this.escapeHtml(w)}</span>`
            ).join(' ');
            const lines = (line1.length ? 1 : 0) + (line2.length ? 1 : 0);
            const charsPerLine = Math.max(8, Math.floor(96 / (0.62 * 7.5)));
            const longestLine = Math.max(line1.join(' ').length, line2.join(' ').length, 1);
            const estLines = Math.max(lines, Math.ceil(longestLine / charsPerLine));
            const TITLE_FONT_TIERS = [
                { maxLines: 1, size: 10.5 },
                { maxLines: 2, size: 9.0 },
                { maxLines: 3, size: 7.5 },
                { maxLines: Infinity, size: 6.5 }
            ];
            const cqw = TITLE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const badgeCqw = Math.round(cqw * 0.34 * 10) / 10;
            const descCqw = Math.round(cqw * 0.26 * 10) / 10;
            return `\
                <div class="${base}">
                    ${leftBar}
                    ${frame}
                    ${corners}
                    ${chip(s.badge || 'POINT')}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <h2 class="text-[#3A2328] w-full min-w-0 font-black tracking-tight leading-[1.12] break-words [overflow-wrap:anywhere] text-center" style="font-size:${cqw}cqw">
                            ${renderWords(line1, 0)}${line1.length && line2.length ? '<br />' : ''}${renderWords(line2, line1.length)}
                        </h2>
                        ${s.badge ? `<p class="text-[#A64A52] w-full min-w-0 font-bold text-center tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere]" style="font-size:${badgeCqw}cqw">${this.escapeHtml(s.badge)}</p>` : ''}
                    </div>
                    ${s.desc ? `\
                    <div class="relative z-10 flex justify-center pb-[2cqw]">
                        <div class="flex items-center gap-[2cqw] bg-white/80 border border-[#C98D94]/40 px-[2.6cqw] py-[0.9cqw] rounded-[0.6cqw] shadow-sm">
                            <span class="w-[0.6cqw] h-[2.2cqw] bg-[#A64A52] rounded-[0.1cqw]"></span>
                            <p class="text-[#3A2328] w-full min-w-0 font-bold tracking-wide break-words [overflow-wrap:anywhere]" style="font-size:${descCqw}cqw">${this.escapeHtml(s.desc)}</p>
                        </div>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'verse') {
            // Same verse tier rules as the classic templates (min 3.6cqw / max 6.0cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 3.4)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const BODY_FONT_TIERS = [
                { maxLines: 2, size: 6.0 },
                { maxLines: 3, size: 5.0 },
                { maxLines: 4, size: 4.2 },
                { maxLines: Infinity, size: 3.6 }
            ];
            const bodyCqw = BODY_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.62) * 10) / 10;
            const versionCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `\
                <div class="${base}">
                    ${leftBar}
                    ${frame}
                    ${corners}
                    ${s.ref ? chip(s.ref) : ''}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-[#3A2328] w-full min-w-0 font-bold leading-relaxed break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">&quot;${this.escapeHtml(s.text)}&quot;</p>
                    </div>
                    ${s.version ? `\
                    <div class="relative z-10 flex flex-col items-center gap-[0.6cqw] pb-[2cqw]">
                        ${diamond}
                        <p class="text-[#A64A52] w-full min-w-0 font-bold tracking-[0.3em] uppercase break-words [overflow-wrap:anywhere] text-center" style="font-size:${versionCqw}cqw">${this.escapeHtml(s.version)}</p>
                    </div>` : ''}
                </div>`;
        }
        if (s.type === 'message') {
            // Same message tier rules as the classic templates (min 4.0cqw / max 6.6cqw).
            const charsPerLine = Math.max(8, Math.floor(96 / (0.58 * 5.5)));
            const estLines = Math.ceil(Math.max(String(s.text || '').length, 1) / charsPerLine);
            const MESSAGE_FONT_TIERS = [
                { maxLines: 2, size: 6.6 },
                { maxLines: 3, size: 5.6 },
                { maxLines: 4, size: 4.8 },
                { maxLines: Infinity, size: 4.0 }
            ];
            const bodyCqw = MESSAGE_FONT_TIERS.find((t) => estLines <= t.maxLines).size;
            const refCqw = Math.round(Math.min(3.0, bodyCqw * 0.5) * 10) / 10;
            const footerCqw = Math.round(bodyCqw * 0.3 * 10) / 10;
            return `\
                <div class="${base}">
                    ${leftBar}
                    ${frame}
                    ${corners}
                    ${s.ref ? chip(s.ref) : ''}
                    <div class="relative z-10 my-auto w-full min-w-0 px-[3cqw]">
                        <p class="text-[#3A2328] w-full min-w-0 font-bold leading-relaxed break-words [overflow-wrap:anywhere] text-center" style="font-size:${bodyCqw}cqw">${this.highlightPhrasesHtml(s.text, this.getHighlights(s), 'text-[#A64A52]')}</p>
                    </div>
                    ${s.footer ? `\
                    <div class="relative z-10 w-full border-t-2 border-[#C98D94]/35 bg-white/80 py-[1.5cqw]">
                        <p class="text-[#A64A52] w-full min-w-0 font-bold tracking-[0.25em] uppercase break-words [overflow-wrap:anywhere] text-center px-[4cqw]" style="font-size:${footerCqw}cqw">${this.escapeHtml(s.footer)}</p>
                    </div>` : ''}
                </div>`;
        }

        return `\
            <div class="${base}">
                ${leftBar}
                ${frame}
                ${corners}
                <div class="relative z-10 p-[4cqw] text-center">
                    <p class="text-[#3A2328] font-semibold" style="font-size:4cqw">${this.escapeHtml(s.text || s.ref || s.title || '')}</p>
                </div>
            </div>`;
    }
    renderSlideVisual(s) {
        return this.applySlideTheme(this.renderSlideVisualRaw(s));
    }

    // Swaps the baked-in "Sermon Classic" palette/fonts for the currently
    // selected template. The two classic templates share one layout while
    // Midnight Aurora provides its own modern layout; in every case the
    // font-size bounds and slide rules stay exactly the same - only design,
    // colors, font style, format and organization change.
    applySlideTheme(html) {
        const t = this.getTheme();
        const shadow = t.shadow || ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.8)'];
        const map = [
            ['blue-900/50', `[${this.hex(t.glow)}]/50`],
            ['#0B192C', this.hex(t.bg)],
            ['#050C16', this.hex(t.bg2)],
            ['#FFD700', this.hex(t.accent)],
            ['#FFF3B0', this.hex(t.accent2)],
            ['#132A4A', this.hex(t.card)],
            ['text-white', `text-[${this.hex(t.text)}]`],
            ['text-slate-200', `text-[${this.hex(t.onCard)}]`],
            ['rgba(0,0,0,0.9)', shadow[0]],
            ['rgba(0,0,0,0.8)', shadow[1]]
        ];
        let out = html;
        for (const [from, to] of map) out = out.split(from).join(to);
        return out.replace('class="relative w-full cq-container', `class="relative w-full cq-container [font-family:${t.font}]`);
    }
}

// Instantiate global app runner
const app = new SlideCraftApp();