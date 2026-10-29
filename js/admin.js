/**
 * Mana Community Survey - Complete Admin Portal Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  let residentsData = [];
  let wholesalersData = [];
  let activeTab = 'residents';

  // DOM Elements - KPI Stats
  const statTotal = document.getElementById('stat-total');
  const statWillingPct = document.getElementById('stat-willing-pct');
  const statTopSpend = document.getElementById('stat-top-spend');
  const statTopApartment = document.getElementById('stat-top-apartment');
  const kpiTitle1 = document.getElementById('kpi-title-1');
  const kpiTitle2 = document.getElementById('kpi-title-2');
  const kpiTitle3 = document.getElementById('kpi-title-3');
  const kpiTitle4 = document.getElementById('kpi-title-4');
  const kpiDesc1 = document.getElementById('kpi-desc-1');
  const kpiDesc2 = document.getElementById('kpi-desc-2');
  const kpiDesc3 = document.getElementById('kpi-desc-3');
  const kpiDesc4 = document.getElementById('kpi-desc-4');

  // Tabs
  const tabBtnResidents = document.getElementById('tab-admin-residents');
  const tabBtnWholesalers = document.getElementById('tab-admin-wholesalers');
  const badgeTabResidents = document.getElementById('badge-tab-residents');
  const badgeTabWholesalers = document.getElementById('badge-tab-wholesalers');
  const residentsView = document.getElementById('residents-view');
  const wholesalersView = document.getElementById('wholesalers-view');
  const exportBtnLabel = document.getElementById('export-btn-label');

  // Filters - Residents
  const searchInput = document.getElementById('admin-search');
  const filterApartment = document.getElementById('filter-apartment');
  const filterWillingness = document.getElementById('filter-willingness');
  const filterSpending = document.getElementById('filter-spending');
  const residentsFilterCount = document.getElementById('residents-filter-count');
  const responsesTbody = document.getElementById('responses-tbody');
  const noResponsesState = document.getElementById('no-responses-state');

  // Filters - Wholesalers
  const wsSearchInput = document.getElementById('admin-ws-search');
  const filterWsGst = document.getElementById('filter-ws-gst');
  const filterWsQuality = document.getElementById('filter-ws-quality');
  const wholesalersFilterCount = document.getElementById('wholesalers-filter-count');
  const wholesalersTbody = document.getElementById('wholesalers-tbody');
  const noWholesalersState = document.getElementById('no-wholesalers-state');

  // Analytics Chart Containers
  const chartWillingness = document.getElementById('chart-willingness');
  const chartSpend = document.getElementById('chart-spend');
  const chartProducts = document.getElementById('chart-products');
  const chartProblems = document.getElementById('chart-problems');
  const analyticsSummaryText = document.getElementById('analytics-summary-text');

  // Modals
  const residentModal = document.getElementById('resident-detail-modal');
  const residentModalTitle = document.getElementById('resident-modal-title');
  const residentModalSubtitle = document.getElementById('resident-modal-subtitle');
  const residentModalContent = document.getElementById('resident-modal-content');
  const residentModalWaBtn = document.getElementById('resident-modal-wa-btn');
  const residentModalCallBtn = document.getElementById('resident-modal-call-btn');
  const btnCloseResidentModal = document.getElementById('btn-close-resident-modal');
  const btnDismissResidentModal = document.getElementById('btn-dismiss-resident-modal');

  const wsModal = document.getElementById('wholesaler-detail-modal');
  const wsModalTitle = document.getElementById('wholesaler-modal-title');
  const wsModalSubtitle = document.getElementById('wholesaler-modal-subtitle');
  const wsModalContent = document.getElementById('wholesaler-modal-content');
  const wsModalWaBtn = document.getElementById('ws-modal-wa-btn');
  const wsModalPrintBtn = document.getElementById('ws-modal-print-btn');
  const btnCloseWsModal = document.getElementById('btn-close-ws-modal');
  const btnDismissWsModal = document.getElementById('btn-dismiss-ws-modal');

  // Action Buttons
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnPrintReport = document.getElementById('btn-print-report');
  const btnSeedDemo = document.getElementById('btn-seed-demo');
  const btnClearAll = document.getElementById('btn-clear-all');
  const adminToast = document.getElementById('admin-toast');

  let currentViewingWs = null;

  // Handle incoming resident updates from Turso or Firebase
  function onResidentsUpdate(data) {
    if (!data) return;
    residentsData = data;
    updateApartmentFilterOptions();
    renderMetrics();
    renderAnalyticsCharts();
    renderResidentsTable();
    updateBadges();
  }

  // Handle incoming wholesaler updates from Turso or Firebase
  function onWholesalersUpdate(data) {
    if (!data) return;
    wholesalersData = data;
    renderWholesalersTable();
    updateBadges();
    if (activeTab === 'wholesalers') {
      renderMetrics();
    }
  }

  // Real-time Firestore sync & Local Storage listener
  if (typeof FirebaseService !== 'undefined') {
    FirebaseService.subscribeResidents(onResidentsUpdate);
    FirebaseService.subscribeWholesalers(onWholesalersUpdate);
  }

  // Real-time Turso Database sync
  if (typeof TursoService !== 'undefined') {
    TursoService.subscribeResidents(onResidentsUpdate);
    TursoService.subscribeWholesalers(onWholesalersUpdate);
  }

  function updateBadges() {
    if (badgeTabResidents) badgeTabResidents.textContent = residentsData.length;
    if (badgeTabWholesalers) badgeTabWholesalers.textContent = wholesalersData.length;
  }

  // Update distinct apartment filter list
  function updateApartmentFilterOptions() {
    if (!filterApartment) return;
    const currentSelection = filterApartment.value;
    const apts = new Set();
    residentsData.forEach(r => {
      if (r.apartmentName && r.apartmentName.trim()) {
        apts.add(r.apartmentName.trim());
      }
    });

    const sortedApts = Array.from(apts).sort();
    filterApartment.innerHTML = '<option value="ALL">All Communities / Apartments</option>';
    sortedApts.forEach(apt => {
      const opt = document.createElement('option');
      opt.value = apt;
      opt.textContent = apt;
      if (apt === currentSelection) opt.selected = true;
      filterApartment.appendChild(opt);
    });
  }

  // Calculate & Render KPI Metrics
  function renderMetrics() {
    if (activeTab === 'residents') {
      if (kpiTitle1) kpiTitle1.textContent = 'Total Resident Responses';
      if (kpiDesc1) kpiDesc1.textContent = 'Apartment demand surveys recorded';
      if (kpiTitle2) kpiTitle2.textContent = 'Willingness / Interest Rate';
      if (kpiDesc2) kpiDesc2.textContent = 'Residents eager for wholesale groceries';
      if (kpiTitle3) kpiTitle3.textContent = 'Top Spending Bracket';
      if (kpiDesc3) kpiDesc3.textContent = 'Median household monthly grocery budget';
      if (kpiTitle4) kpiTitle4.textContent = 'Most Active Community';
      if (kpiDesc4) kpiDesc4.textContent = 'Highest participation rate by community';

      const total = residentsData.length;
      if (statTotal) statTotal.textContent = total;

      if (total > 0) {
        const willingCount = residentsData.filter(r => r.willingness && r.willingness.startsWith('Yes')).length;
        if (statWillingPct) statWillingPct.textContent = `${Math.round((willingCount / total) * 100)}%`;

        const spendMap = {};
        const aptMap = {};
        residentsData.forEach(r => {
          if (r.monthlySpending) spendMap[r.monthlySpending] = (spendMap[r.monthlySpending] || 0) + 1;
          if (r.apartmentName) aptMap[r.apartmentName] = (aptMap[r.apartmentName] || 0) + 1;
        });

        const topSpend = Object.keys(spendMap).reduce((a, b) => spendMap[a] > spendMap[b] ? a : b, '-');
        const topApt = Object.keys(aptMap).reduce((a, b) => aptMap[a] > aptMap[b] ? a : b, '-');

        if (statTopSpend) statTopSpend.textContent = topSpend.replace(' / month', '');
        if (statTopApartment) statTopApartment.textContent = topApt.length > 20 ? topApt.substring(0, 18) + '...' : topApt;
      } else {
        if (statWillingPct) statWillingPct.textContent = '0%';
        if (statTopSpend) statTopSpend.textContent = '-';
        if (statTopApartment) statTopApartment.textContent = '-';
      }
    } else {
      // Wholesalers KPI
      if (kpiTitle1) kpiTitle1.textContent = 'Total Wholesale Quotations';
      if (kpiDesc1) kpiDesc1.textContent = 'Registered vendor quotations received';
      if (kpiTitle2) kpiTitle2.textContent = 'Regular GST Invoiced %';
      if (kpiDesc2) kpiDesc2.textContent = 'Suppliers providing official B2B Tax Invoices';
      if (kpiTitle3) kpiTitle3.textContent = '100% Replacement Policy';
      if (kpiDesc3) kpiDesc3.textContent = 'Suppliers offering 24-48 hr replacements';
      if (kpiTitle4) kpiTitle4.textContent = 'Primary Mandis';
      if (kpiDesc4) kpiDesc4.textContent = 'Key wholesale yards and hubs';

      const totalWs = wholesalersData.length;
      if (statTotal) statTotal.textContent = totalWs;

      if (totalWs > 0) {
        const gstCount = wholesalersData.filter(w => w.gstStatus && w.gstStatus.includes('Regular')).length;
        if (statWillingPct) statWillingPct.textContent = `${Math.round((gstCount / totalWs) * 100)}%`;

        const replaceCount = wholesalersData.filter(w => w.replacementPolicy && w.replacementPolicy.includes('100%')).length;
        if (statTopSpend) statTopSpend.textContent = `${Math.round((replaceCount / totalWs) * 100)}%`;

        const locationMap = {};
        wholesalersData.forEach(w => {
          if (w.location) locationMap[w.location] = (locationMap[w.location] || 0) + 1;
        });
        const topLoc = Object.keys(locationMap).reduce((a, b) => locationMap[a] > locationMap[b] ? a : b, '-');
        if (statTopApartment) statTopApartment.textContent = topLoc.length > 20 ? topLoc.substring(0, 18) + '...' : topLoc;
      } else {
        if (statWillingPct) statWillingPct.textContent = '0%';
        if (statTopSpend) statTopSpend.textContent = '0%';
        if (statTopApartment) statTopApartment.textContent = '-';
      }
    }
  }

  // Render Visual Analytics & Insights Charts
  function renderAnalyticsCharts() {
    const total = residentsData.length;
    if (analyticsSummaryText) {
      analyticsSummaryText.textContent = total > 0 ? `Aggregated across ${total} resident surveys` : 'No survey data recorded yet';
    }

    if (total === 0) {
      if (chartWillingness) chartWillingness.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; padding:1rem 0;">No responses yet</div>';
      if (chartSpend) chartSpend.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; padding:1rem 0;">No responses yet</div>';
      if (chartProducts) chartProducts.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; padding:1rem 0;">No responses yet</div>';
      if (chartProblems) chartProblems.innerHTML = '<div style="color:#94a3b8; font-size:0.8rem; padding:1rem 0;">No responses yet</div>';
      return;
    }

    // 1. Willingness Distribution
    let yesCount = 0;
    let maybeCount = 0;
    let notCount = 0;

    residentsData.forEach(r => {
      const w = r.willingness || '';
      if (w.startsWith('Yes')) yesCount++;
      else if (w.includes('Maybe')) maybeCount++;
      else notCount++;
    });

    if (chartWillingness) {
      chartWillingness.innerHTML = `
        ${createChartBarItem('Definitely Yes', yesCount, total, 'bg-emerald')}
        ${createChartBarItem('Maybe / Needs Details', maybeCount, total, 'bg-amber')}
        ${createChartBarItem('Not Interested', notCount, total, 'bg-rose')}
      `;
    }

    // 2. Spending Distribution
    const spendBrackets = [
      { label: 'Under ₹3,000', color: 'bg-blue' },
      { label: '₹3,000 - ₹6,000', color: 'bg-emerald' },
      { label: '₹6,000 - ₹10,000', color: 'bg-amber' },
      { label: '₹10,000 - ₹15,000', color: 'bg-purple' },
      { label: 'Above ₹15,000', color: 'bg-rose' }
    ];

    const spendCounts = {};
    residentsData.forEach(r => {
      const s = r.monthlySpending || '';
      spendBrackets.forEach(b => {
        if (s.includes(b.label.split(' ')[0])) {
          spendCounts[b.label] = (spendCounts[b.label] || 0) + 1;
        }
      });
    });

    if (chartSpend) {
      chartSpend.innerHTML = spendBrackets.map(b => {
        const count = spendCounts[b.label] || 0;
        return createChartBarItem(b.label, count, total, b.color);
      }).join('');
    }

    // 3. Demanded Sourcing Products
    const productCatalog = [
      { key: 'Farm-Fresh Vegetables', short: 'Fresh Veggies & Fruits', color: 'bg-emerald' },
      { key: 'Monthly Staples Box', short: 'Monthly Staples & Ration', color: 'bg-blue' },
      { key: 'Cold-Pressed Oils', short: 'Cold-Pressed Oils & Ghee', color: 'bg-amber' },
      { key: 'Daily Dairy', short: 'Daily Dairy, Paneer & Eggs', color: 'bg-purple' },
      { key: 'Organic', short: '100% Organic / Clean', color: 'bg-rose' }
    ];

    const productCounts = {};
    residentsData.forEach(r => {
      (r.serviceProducts || []).forEach(p => {
        productCatalog.forEach(c => {
          if (p.includes(c.key)) {
            productCounts[c.short] = (productCounts[c.short] || 0) + 1;
          }
        });
      });
    });

    if (chartProducts) {
      chartProducts.innerHTML = productCatalog.map(c => {
        const count = productCounts[c.short] || 0;
        return createChartBarItem(c.short, count, total, c.color);
      }).join('');
    }

    // 4. Key Pain Points
    const painCatalog = [
      { key: 'High prices', short: 'Inflated Retail Markups', color: 'bg-rose' },
      { key: 'freshness', short: 'Stale / Poor Freshness', color: 'bg-amber' },
      { key: 'stock', short: 'Missing Items & Stockouts', color: 'bg-purple' },
      { key: 'bags', short: 'Heavy Bag Lifting & Queues', color: 'bg-blue' },
      { key: 'Chemicals', short: 'Chemical / Adulteration Doubts', color: 'bg-emerald' }
    ];

    const painCounts = {};
    residentsData.forEach(r => {
      (r.problemsFaced || []).forEach(p => {
        painCatalog.forEach(c => {
          if (p.toLowerCase().includes(c.key.toLowerCase())) {
            painCounts[c.short] = (painCounts[c.short] || 0) + 1;
          }
        });
      });
    });

    if (chartProblems) {
      chartProblems.innerHTML = painCatalog.map(c => {
        const count = painCounts[c.short] || 0;
        return createChartBarItem(c.short, count, total, c.color);
      }).join('');
    }
  }

  function createChartBarItem(label, count, total, colorClass) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div class="chart-bar-item">
        <div class="chart-bar-label-row">
          <span>${escapeHtml(label)}</span>
          <strong>${pct}% (${count})</strong>
        </div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${colorClass}" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }

  // Render Residents Data Table with Multi-Filter
  function renderResidentsTable() {
    if (!responsesTbody) return;
    const query = (searchInput?.value || '').toLowerCase().trim();
    const aptFilter = filterApartment?.value || 'ALL';
    const willFilter = filterWillingness?.value || 'ALL';
    const spendFilter = filterSpending?.value || 'ALL';

    const filtered = residentsData.filter(r => {
      const matchesQuery = !query ||
        (r.personName && r.personName.toLowerCase().includes(query)) ||
        (r.apartmentName && r.apartmentName.toLowerCase().includes(query)) ||
        (r.contactNumber && r.contactNumber.includes(query)) ||
        (r.flatNumber && r.flatNumber.toLowerCase().includes(query));

      const matchesApt = aptFilter === 'ALL' || r.apartmentName === aptFilter;
      const matchesWill = willFilter === 'ALL' || r.willingness === willFilter;
      const matchesSpend = spendFilter === 'ALL' || (r.monthlySpending && r.monthlySpending.includes(spendFilter.split(' ')[0]));

      return matchesQuery && matchesApt && matchesWill && matchesSpend;
    });

    if (residentsFilterCount) {
      residentsFilterCount.textContent = `Showing ${filtered.length} of ${residentsData.length} records`;
    }

    responsesTbody.innerHTML = '';

    if (filtered.length === 0) {
      noResponsesState?.classList.remove('hidden');
    } else {
      noResponsesState?.classList.add('hidden');
      filtered.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = 'clickable-row';

        let badgeClass = 'badge-green';
        if (row.willingness && row.willingness.includes('Maybe')) badgeClass = 'badge-yellow';
        if (row.willingness && row.willingness.includes('Not')) badgeClass = 'badge-red';

        tr.innerHTML = `
          <td style="color:#64748b; font-size:0.78rem; white-space:nowrap;">${escapeHtml(row.submittedAt || '')}</td>
          <td>
            <strong>${escapeHtml(row.apartmentName || '')}</strong>
            ${row.flatNumber ? `<div style="font-size:0.76rem; color:#64748b;">${escapeHtml(row.flatNumber)}</div>` : ''}
          </td>
          <td>
            <strong>${escapeHtml(row.personName || '')}</strong>
            ${row.contactNumber ? `<div><a href="tel:${escapeHtml(row.contactNumber)}" class="contact-link" onclick="event.stopPropagation()">📞 ${escapeHtml(row.contactNumber)}</a></div>` : ''}
          </td>
          <td><span class="badge-tag ${badgeClass}">${escapeHtml(row.willingness || '')}</span></td>
          <td><strong>${escapeHtml(row.monthlySpending || '-')}</strong></td>
          <td style="font-size:0.82rem;">${escapeHtml(row.purchaseFrequency || '-')}</td>
          <td style="max-width:180px; font-size:0.82rem;">${escapeHtml(row.deliveryMethod || '-')}</td>
          <td style="font-size:0.82rem;">${escapeHtml(row.tryMonthlyService || '-')}</td>
          <td style="text-align: right;" onclick="event.stopPropagation()">
            <div class="action-btn-group" style="justify-content: flex-end;">
              <button class="btn-view-row" data-id="${row.id}" title="View complete details">
                👁️ View
              </button>
              <button class="btn-delete-row" data-id="${row.id}" title="Delete response">✕</button>
            </div>
          </td>
        `;

        // Click row to view
        tr.addEventListener('click', () => openResidentModal(row));

        responsesTbody.appendChild(tr);
      });

      // Bind buttons in rows
      responsesTbody.querySelectorAll('.btn-view-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-id');
          const found = residentsData.find(r => r.id === id);
          if (found) openResidentModal(found);
        });
      });

      responsesTbody.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this resident response?')) {
            residentsData = await FirebaseService.deleteResident(id);
            updateApartmentFilterOptions();
            renderMetrics();
            renderAnalyticsCharts();
            renderResidentsTable();
            updateBadges();
            showToast('🗑️ Response deleted successfully');
          }
        });
      });
    }
  }

  // Render Wholesalers Quotations Table with Search & Filters
  function renderWholesalersTable() {
    if (!wholesalersTbody) return;
    const query = (wsSearchInput?.value || '').toLowerCase().trim();
    const gstFilter = filterWsGst?.value || 'ALL';
    const qualityFilter = filterWsQuality?.value || 'ALL';

    const filtered = wholesalersData.filter(w => {
      const matchesQuery = !query ||
        (w.firmName && w.firmName.toLowerCase().includes(query)) ||
        (w.personName && w.personName.toLowerCase().includes(query)) ||
        (w.contactPhone && w.contactPhone.includes(query)) ||
        (w.location && w.location.toLowerCase().includes(query)) ||
        (w.gstin && w.gstin.toLowerCase().includes(query));

      const matchesGst = gstFilter === 'ALL' || (w.gstStatus && w.gstStatus.includes(gstFilter));
      const matchesQuality = qualityFilter === 'ALL' || (w.qualityGrade && w.qualityGrade.includes(qualityFilter));

      return matchesQuery && matchesGst && matchesQuality;
    });

    if (wholesalersFilterCount) {
      wholesalersFilterCount.textContent = `Showing ${filtered.length} of ${wholesalersData.length} quotations`;
    }

    wholesalersTbody.innerHTML = '';

    if (filtered.length === 0) {
      noWholesalersState?.classList.remove('hidden');
    } else {
      noWholesalersState?.classList.add('hidden');
      filtered.forEach(ws => {
        const tr = document.createElement('tr');
        tr.className = 'clickable-row';

        tr.innerHTML = `
          <td style="color:#64748b; font-size:0.78rem; white-space:nowrap;">${escapeHtml(ws.submittedAt || '')}</td>
          <td>
            <strong>${escapeHtml(ws.firmName || '')}</strong>
            <div style="font-size:0.76rem; color:#64748b;">📍 ${escapeHtml(ws.location || '')}</div>
          </td>
          <td>
            <strong>${escapeHtml(ws.personName || '')}</strong>
            <div><a href="https://wa.me/91${escapeHtml(ws.contactPhone)}" target="_blank" class="contact-link" onclick="event.stopPropagation()">💬 ${escapeHtml(ws.contactPhone || '')}</a></div>
          </td>
          <td>
            <span class="badge-tag badge-green">${escapeHtml(ws.gstStatus?.includes('Regular') ? 'B2B Tax Invoice' : ws.gstStatus?.substring(0, 20))}</span>
            ${ws.gstin ? `<div style="font-size:0.75rem; font-family:monospace; color:#475569;">${escapeHtml(ws.gstin)}</div>` : ''}
          </td>
          <td>
            <span class="badge-tag ${ws.fssaiStatus?.includes('Valid') ? 'badge-green' : 'badge-yellow'}">${escapeHtml(ws.fssaiStatus?.includes('Central') ? 'Central/State Lic' : 'FSSAI Registered')}</span>
            ${ws.fssaiNumber ? `<div style="font-size:0.75rem; color:#64748b;">No: ${escapeHtml(ws.fssaiNumber)}</div>` : ''}
          </td>
          <td style="font-size:0.82rem;">
            <div><strong>${escapeHtml(ws.qualityGrade || 'Grade A')}</strong></div>
            <div style="color:#64748b; font-size:0.75rem;">${escapeHtml(ws.moistureContent || 'Under 12% Moisture')}</div>
          </td>
          <td style="font-size:0.82rem;">
            <span class="badge-tag ${ws.replacementPolicy?.includes('100%') ? 'badge-green' : 'badge-yellow'}">
              ${escapeHtml(ws.replacementPolicy?.includes('100%') ? '⚡ 100% Immediate' : 'Credit Note / Other')}
            </span>
          </td>
          <td style="text-align: right;" onclick="event.stopPropagation()">
            <div class="action-btn-group" style="justify-content: flex-end;">
              <button class="btn-view-row btn-view-ws" data-id="${ws.id}" title="View full B2B quotation">
                👁️ View
              </button>
              <button class="btn-delete-ws" data-id="${ws.id}" title="Delete quotation">✕</button>
            </div>
          </td>
        `;

        tr.addEventListener('click', () => openWholesalerModal(ws));
        wholesalersTbody.appendChild(tr);
      });

      wholesalersTbody.querySelectorAll('.btn-view-ws').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-id');
          const found = wholesalersData.find(w => w.id === id);
          if (found) openWholesalerModal(found);
        });
      });

      wholesalersTbody.querySelectorAll('.btn-delete-ws').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this wholesaler quotation?')) {
            wholesalersData = await FirebaseService.deleteWholesaler(id);
            renderWholesalersTable();
            updateBadges();
            if (activeTab === 'wholesalers') renderMetrics();
            showToast('🗑️ Wholesaler quotation deleted');
          }
        });
      });
    }
  }

  // Open Resident Detail Modal
  function openResidentModal(data) {
    if (!residentModal) return;

    if (residentModalTitle) residentModalTitle.textContent = `${data.personName} • ${data.apartmentName}`;
    if (residentModalSubtitle) residentModalSubtitle.textContent = `Submitted on ${data.submittedAt || 'Today'} • Flat ${data.flatNumber || 'Unit not specified'}`;

    const cleanPhone = (data.contactNumber || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `Hello ${data.personName},\n\nThank you for participating in the Mana Community grocery survey for ${data.apartmentName}! We have recorded your interest in wholesale community sourcing. We will share updates on the upcoming society bulk trial box soon.\n\nBest regards,\nMana Community Procurement Team`
    );

    if (residentModalWaBtn) {
      if (cleanPhone) {
        residentModalWaBtn.href = `https://wa.me/91${cleanPhone}?text=${waText}`;
        residentModalWaBtn.style.display = 'inline-flex';
      } else {
        residentModalWaBtn.style.display = 'none';
      }
    }

    if (residentModalCallBtn) {
      if (cleanPhone) {
        residentModalCallBtn.href = `tel:${cleanPhone}`;
        residentModalCallBtn.style.display = 'inline-flex';
      } else {
        residentModalCallBtn.style.display = 'none';
      }
    }

    let badgeClass = 'badge-green';
    if (data.willingness && data.willingness.includes('Maybe')) badgeClass = 'badge-yellow';
    if (data.willingness && data.willingness.includes('Not')) badgeClass = 'badge-red';

    if (residentModalContent) {
      residentModalContent.innerHTML = `
        <div class="detail-grid-2">
          <!-- Profile Card -->
          <div class="detail-section-card">
            <div class="detail-section-title">👤 Resident & Community Info</div>
            <div class="detail-field-row">
              <span class="detail-label">Resident Name:</span>
              <div class="detail-value">${escapeHtml(data.personName)}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Apartment / Community:</span>
              <div class="detail-value">${escapeHtml(data.apartmentName)}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Flat / Unit Number:</span>
              <div class="detail-value">${escapeHtml(data.flatNumber || 'Not specified')}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Contact / WhatsApp:</span>
              <div class="detail-value">📞 ${escapeHtml(data.contactNumber || 'Not provided')}</div>
            </div>
            <div class="detail-field-row" style="margin-top:0.75rem;">
              <span class="detail-label">Willingness Level:</span>
              <div><span class="badge-tag ${badgeClass}">${escapeHtml(data.willingness || 'Not answered')}</span></div>
            </div>
          </div>

          <!-- Household Grocery Profile -->
          <div class="detail-section-card">
            <div class="detail-section-title">🛒 Grocery Habits & Spending</div>
            <div class="detail-field-row">
              <span class="detail-label">Estimated Monthly Spend:</span>
              <div class="detail-value" style="color:#059669; font-size:1.1rem;">${escapeHtml(data.monthlySpending || 'Not specified')}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Purchase Frequency:</span>
              <div class="detail-value">${escapeHtml(data.purchaseFrequency || 'Not specified')}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Current Grocery Sources:</span>
              <div class="detail-chips-wrap">
                ${(data.whereBuy || []).map(w => `<span class="detail-chip">${escapeHtml(w)}</span>`).join('') || '<span class="detail-value">-</span>'}
              </div>
            </div>
          </div>
        </div>

        <!-- Regularly Bought Items -->
        <div class="detail-section-card" style="margin-bottom: 1.15rem;">
          <div class="detail-section-title">🌾 Items Regularly Bought by Household</div>
          <div class="detail-chips-wrap">
            ${(data.itemsBought || []).map(i => `<span class="detail-chip highlight">${escapeHtml(i)}</span>`).join('') || '<span class="detail-value">None selected</span>'}
          </div>
          ${data.otherItems ? `<div style="margin-top:0.65rem; font-size:0.85rem; color:#475569;"><strong>Other Specific Products:</strong> ${escapeHtml(data.otherItems)}</div>` : ''}
        </div>

        <!-- Desired Community Service Products -->
        <div class="detail-section-card" style="margin-bottom: 1.15rem;">
          <div class="detail-section-title">✨ Products Desired Through Community Service</div>
          <div class="detail-chips-wrap">
            ${(data.serviceProducts || []).map(p => `<span class="detail-chip highlight">⭐ ${escapeHtml(p)}</span>`).join('') || '<span class="detail-value">None selected</span>'}
          </div>
        </div>

        <!-- Problems Faced -->
        <div class="detail-section-card" style="margin-bottom: 1.15rem;">
          <div class="detail-section-title">⚠️ Pain Points & Shopping Frustrations</div>
          <div class="detail-chips-wrap">
            ${(data.problemsFaced || []).map(pf => `<span class="detail-chip warning">⚠️ ${escapeHtml(pf)}</span>`).join('') || '<span class="detail-value">None reported</span>'}
          </div>
          ${data.otherProblems ? `<div style="margin-top:0.65rem; font-size:0.85rem; color:#dc2626;"><strong>Other Complaints:</strong> ${escapeHtml(data.otherProblems)}</div>` : ''}
        </div>

        <!-- Logistics & Suggestions -->
        <div class="detail-grid-2">
          <div class="detail-section-card">
            <div class="detail-section-title">🚚 Delivery & Trial Preferences</div>
            <div class="detail-field-row">
              <span class="detail-label">Preferred Delivery Method:</span>
              <div class="detail-value">${escapeHtml(data.deliveryMethod || 'Not specified')}</div>
            </div>
            <div class="detail-field-row" style="margin-top:0.5rem;">
              <span class="detail-label">Monthly Service Trial Interest:</span>
              <div class="detail-value">${escapeHtml(data.tryMonthlyService || 'Not specified')}</div>
            </div>
          </div>

          <div class="detail-section-card">
            <div class="detail-section-title">💬 Specific Suggestions & Notes</div>
            <div class="detail-value" style="font-weight: normal; font-size: 0.88rem; color: #334155; line-height:1.5;">
              ${escapeHtml(data.otherSuggestions) || '<em style="color:#94a3b8;">No additional suggestions provided</em>'}
            </div>
          </div>
        </div>
      `;
    }

    residentModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeResidentModal() {
    if (residentModal) {
      residentModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Open Wholesaler Detail Modal
  function openWholesalerModal(ws) {
    if (!wsModal) return;
    currentViewingWs = ws;

    if (wsModalTitle) wsModalTitle.textContent = `${ws.firmName || 'Wholesale Supplier'} • Mandi Profile`;
    if (wsModalSubtitle) wsModalSubtitle.textContent = `Submitted on ${ws.submittedAt || 'Today'} • Location: ${ws.location || 'Hyderabad Mandi'}`;

    const cleanPhone = (ws.contactPhone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(
      `Hello ${ws.personName || 'Sir'},\n\nWe are reviewing your wholesale quotation for *${ws.firmName}* for the Mana Community apartment supply chain. We would like to discuss sample kit inspection and delivery schedules.\n\nBest regards,\nMana Community Procurement Team`
    );

    if (wsModalWaBtn) {
      if (cleanPhone) {
        wsModalWaBtn.href = `https://wa.me/91${cleanPhone}?text=${waText}`;
        wsModalWaBtn.style.display = 'inline-flex';
      } else {
        wsModalWaBtn.style.display = 'none';
      }
    }

    if (wsModalContent) {
      wsModalContent.innerHTML = `
        <div class="detail-grid-2">
          <!-- Firm Info -->
          <div class="detail-section-card">
            <div class="detail-section-title">🏢 Wholesale Firm & Contact</div>
            <div class="detail-field-row">
              <span class="detail-label">Business / Firm Name:</span>
              <div class="detail-value">${escapeHtml(ws.firmName)}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Contact Person & Role:</span>
              <div class="detail-value">${escapeHtml(ws.personName)}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">WhatsApp / Phone:</span>
              <div class="detail-value">📞 ${escapeHtml(ws.contactPhone)}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Godown / Market Yard:</span>
              <div class="detail-value">📍 ${escapeHtml(ws.location)}</div>
            </div>
          </div>

          <!-- Tax & Food Safety Compliance -->
          <div class="detail-section-card">
            <div class="detail-section-title">🛡️ Tax & Safety Compliance</div>
            <div class="detail-field-row">
              <span class="detail-label">GST Status:</span>
              <div><span class="badge-tag badge-green">${escapeHtml(ws.gstStatus)}</span></div>
            </div>
            ${ws.gstin ? `
              <div class="detail-field-row" style="margin-top:0.4rem;">
                <span class="detail-label">GSTIN Number:</span>
                <div class="detail-value" style="font-family:monospace; background:#e2e8f0; padding:0.2rem 0.5rem; border-radius:4px; display:inline-block;">
                  ${escapeHtml(ws.gstin)}
                </div>
              </div>` : ''}
            <div class="detail-field-row" style="margin-top:0.6rem;">
              <span class="detail-label">FSSAI Status:</span>
              <div><span class="badge-tag ${ws.fssaiStatus?.includes('Valid') ? 'badge-green' : 'badge-yellow'}">${escapeHtml(ws.fssaiStatus)}</span></div>
            </div>
            ${ws.fssaiNumber ? `
              <div class="detail-field-row" style="margin-top:0.4rem;">
                <span class="detail-label">14-Digit FSSAI License:</span>
                <div class="detail-value">${escapeHtml(ws.fssaiNumber)} (${escapeHtml(ws.fssaiValidity || 'Active')})</div>
              </div>` : ''}
          </div>
        </div>

        <!-- Quality Standards & Varieties -->
        <div class="detail-section-card" style="margin-bottom:1.15rem;">
          <div class="detail-section-title">🌾 Quality Standards, Sortex & Products Supplied</div>
          <div class="detail-grid-2" style="margin-bottom:0.75rem;">
            <div>
              <span class="detail-label">Cleaning & Sortex Grade:</span>
              <div class="detail-value">⭐ ${escapeHtml(ws.qualityGrade || '100% Sortex Cleaned')}</div>
            </div>
            <div>
              <span class="detail-label">Moisture Guarantee:</span>
              <div class="detail-value">💧 ${escapeHtml(ws.moistureContent || 'Under 12% Moisture')}</div>
            </div>
            <div>
              <span class="detail-label">Free Sample Kits:</span>
              <div class="detail-value">🎁 ${escapeHtml(ws.sampleKitAvailability || 'Provided on request')}</div>
            </div>
            <div>
              <span class="detail-label">Inspection Allowed:</span>
              <div class="detail-value">✅ ${escapeHtml(ws.inspectionAllowed || 'Yes (100% on vehicle)')}</div>
            </div>
          </div>
          
          <div style="margin-top: 0.85rem;">
            <span class="detail-label" style="font-weight: 700;">Quoted Products & Wholesale Rate Card:</span>
            ${(ws.items && ws.items.length > 0) ? `
              <div style="margin-top: 0.5rem; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #475569; font-size: 0.76rem; text-transform: uppercase;">
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Product Name</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Packaging / Unit</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Price of 1 kg (₹)</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Wholesale Price (₹)</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Wholesale Min Qty</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Bulk Order Price (₹)</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Bulk Order Min Qty</th>
                      <th style="padding: 0.6rem 0.85rem; border-bottom: 1px solid #e2e8f0;">Grade / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ws.items.map(it => `
                      <tr style="border-bottom: 1px solid #f8fafc; background: #ffffff;">
                        <td style="padding: 0.65rem 0.85rem; font-weight: 600; color: #0f172a;">${escapeHtml(it.name)}</td>
                        <td style="padding: 0.65rem 0.85rem; color: #475569;"><span class="badge-tag badge-slate">${escapeHtml(it.unit || 'Per kg')}</span></td>
                        <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #0284c7; font-size: 0.95rem;">${it.pricePerKg ? `₹${escapeHtml(it.pricePerKg)}` : (it.unit === 'Per kg' && it.price ? `₹${escapeHtml(it.price)}` : '<span style="color:#94a3b8;">-</span>')}</td>
                        <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #059669; font-size: 0.95rem;">${it.price ? `₹${escapeHtml(it.price)}` : '<span style="color:#94a3b8;">Unpriced</span>'}</td>
                        <td style="padding: 0.65rem 0.85rem; font-weight: 600; color: #065f46; font-size: 0.85rem;">${it.wholesaleQty ? escapeHtml(it.wholesaleQty) : '<span style="color:#94a3b8;">-</span>'}</td>
                        <td style="padding: 0.65rem 0.85rem; font-weight: 700; color: #7c3aed; font-size: 0.95rem;">${it.bulkPrice ? `₹${escapeHtml(it.bulkPrice)}` : '<span style="color:#94a3b8;">-</span>'}</td>
                        <td style="padding: 0.65rem 0.85rem; font-weight: 600; color: #5b21b6; font-size: 0.85rem;">${it.bulkQty ? escapeHtml(it.bulkQty) : '<span style="color:#94a3b8;">-</span>'}</td>
                        <td style="padding: 0.65rem 0.85rem; color: #64748b; font-size: 0.8rem;">${escapeHtml(it.note || '-')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div class="detail-chips-wrap" style="margin-top: 0.4rem;">
                ${(ws.productVarieties || []).map(p => `<span class="detail-chip highlight">${escapeHtml(p)}</span>`).join('') || '<span class="detail-value">Staples & Grains</span>'}
              </div>
            `}
          </div>
        </div>

        <!-- Packaging & Replacement -->
        <div class="detail-grid-2" style="margin-bottom:1.15rem;">
          <div class="detail-section-card">
            <div class="detail-section-title">📦 Manufacturing, Expiry & Packaging</div>
            <div class="detail-field-row">
              <span class="detail-label">Mfg & Expiry Printed:</span>
              <div class="detail-value">${escapeHtml(ws.mfgExpiryDetails || 'Printed on master bags')}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Minimum Shelf Life:</span>
              <div class="detail-value">${escapeHtml(ws.shelfLifeGuarantee || 'At least 6 months')}</div>
            </div>
            <div class="detail-field-row">
              <span class="detail-label">Packaging & Seal:</span>
              <div class="detail-value">${escapeHtml(ws.batchAndSealedCondition || 'Factory machine-sealed')}</div>
            </div>
          </div>

          <div class="detail-section-card">
            <div class="detail-section-title">⚡ Replacement & Credit Terms</div>
            <div class="detail-field-row">
              <span class="detail-label">Replacement Guarantee:</span>
              <div><span class="badge-tag ${ws.replacementPolicy?.includes('100%') ? 'badge-green' : 'badge-yellow'}">${escapeHtml(ws.replacementPolicy)}</span></div>
            </div>
            <div class="detail-field-row" style="margin-top:0.4rem;">
              <span class="detail-label">Payment Timing:</span>
              <div class="detail-value">${escapeHtml(ws.paymentTiming || 'Payment on Delivery (POD)')}</div>
            </div>
            <div class="detail-field-row" style="margin-top:0.4rem;">
              <span class="detail-label">Accepted Modes:</span>
              <div class="detail-value">${escapeHtml((ws.paymentModes || []).join(', ') || 'UPI, NEFT, Cheque')}</div>
            </div>
            <div class="detail-field-row" style="margin-top:0.4rem;">
              <span class="detail-label">Credit Terms:</span>
              <div class="detail-value">${escapeHtml(ws.creditFacility || 'Spot / negotiable')}</div>
            </div>
          </div>
        </div>

        <!-- Logistics & Quotation Rates -->
        <div class="detail-section-card">
          <div class="detail-section-title">📝 Quotation Rates, MOQ & Delivery Coverage</div>
          <div class="detail-grid-2" style="margin-bottom:0.75rem;">
            <div>
              <span class="detail-label">Minimum Order Quantity (MOQ):</span>
              <div class="detail-value">${escapeHtml(ws.moq || 'No strict minimum')}</div>
            </div>
            <div>
              <span class="detail-label">Delivery Radius & Charges:</span>
              <div class="detail-value">${escapeHtml(ws.deliveryCoverage || 'Free delivery within Mandi radius')}</div>
            </div>
          </div>
          <div class="detail-field-row">
            <span class="detail-label">Wholesale Price Quotation Notes:</span>
            <div class="detail-value" style="font-family:inherit; font-weight:normal; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem; margin-top:0.4rem; white-space:pre-wrap; line-height:1.5;">
              ${escapeHtml(ws.notes) || '<em style="color:#94a3b8;">No additional rate notes provided</em>'}
            </div>
          </div>
        </div>
      `;
    }

    wsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeWholesalerModal() {
    if (wsModal) {
      wsModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Print single wholesaler quotation
  wsModalPrintBtn?.addEventListener('click', () => {
    window.print();
  });

  // Tab switching
  tabBtnResidents?.addEventListener('click', () => {
    activeTab = 'residents';
    tabBtnResidents.classList.add('active');
    tabBtnResidents.setAttribute('aria-selected', 'true');
    tabBtnWholesalers?.classList.remove('active');
    tabBtnWholesalers?.setAttribute('aria-selected', 'false');

    residentsView?.classList.remove('hidden');
    wholesalersView?.classList.add('hidden');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Export Residents CSV';

    renderMetrics();
  });

  tabBtnWholesalers?.addEventListener('click', () => {
    activeTab = 'wholesalers';
    tabBtnWholesalers.classList.add('active');
    tabBtnWholesalers.setAttribute('aria-selected', 'true');
    tabBtnResidents?.classList.remove('active');
    tabBtnResidents?.setAttribute('aria-selected', 'false');

    wholesalersView?.classList.remove('hidden');
    residentsView?.classList.add('hidden');
    if (exportBtnLabel) exportBtnLabel.textContent = 'Export Wholesalers CSV';

    renderMetrics();
    renderWholesalersTable();
  });

  // Filter & Search events
  searchInput?.addEventListener('input', renderResidentsTable);
  filterApartment?.addEventListener('change', renderResidentsTable);
  filterWillingness?.addEventListener('change', renderResidentsTable);
  filterSpending?.addEventListener('change', renderResidentsTable);

  wsSearchInput?.addEventListener('input', renderWholesalersTable);
  filterWsGst?.addEventListener('change', renderWholesalersTable);
  filterWsQuality?.addEventListener('change', renderWholesalersTable);

  // Modal event listeners
  btnCloseResidentModal?.addEventListener('click', closeResidentModal);
  btnDismissResidentModal?.addEventListener('click', closeResidentModal);
  residentModal?.addEventListener('click', (e) => {
    if (e.target === residentModal) closeResidentModal();
  });

  btnCloseWsModal?.addEventListener('click', closeWholesalerModal);
  btnDismissWsModal?.addEventListener('click', closeWholesalerModal);
  wsModal?.addEventListener('click', (e) => {
    if (e.target === wsModal) closeWholesalerModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeResidentModal();
      closeWholesalerModal();
    }
  });

  // Smart CSV Export
  function exportCsv() {
    if (activeTab === 'residents') {
      if (residentsData.length === 0) {
        alert('No resident survey responses recorded to export.');
        return;
      }

      const headers = [
        'Date & Time',
        'Apartment / Community Name',
        'Flat / Unit Number',
        'Resident Name',
        'Contact Number',
        'Willingness',
        'Current Grocery Sources',
        'Items Regularly Bought',
        'Other Items',
        'Approx Monthly Spending',
        'Purchase Frequency',
        'Desired Service Products',
        'Current Problems Faced',
        'Other Problems',
        'Preferred Delivery Method',
        'Monthly Service Trial Interest',
        'Other Suggestions'
      ];

      const rows = [headers.join(',')];

      residentsData.forEach(r => {
        const values = [
          r.submittedAt || '',
          r.apartmentName || '',
          r.flatNumber || '',
          r.personName || '',
          r.contactNumber || '',
          r.willingness || '',
          (r.whereBuy || []).join('; '),
          (r.itemsBought || []).join('; '),
          r.otherItems || '',
          r.monthlySpending || '',
          r.purchaseFrequency || '',
          (r.serviceProducts || []).join('; '),
          (r.problemsFaced || []).join('; '),
          r.otherProblems || '',
          r.deliveryMethod || '',
          r.tryMonthlyService || '',
          r.otherSuggestions || ''
        ].map(val => `"${String(val).replace(/"/g, '""')}"`);

        rows.push(values.join(','));
      });

      downloadFile(rows.join('\n'), `Mana_Community_Survey_Responses_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      showToast('📥 Resident survey data exported to CSV');
    } else {
      if (wholesalersData.length === 0) {
        alert('No wholesale vendor quotations recorded to export.');
        return;
      }

      const headers = [
        'Date & Time',
        'Wholesale Firm Name',
        'Contact Person',
        'Phone Number',
        'Godown / Mandi Location',
        'GST Status',
        'GSTIN Number',
        'FSSAI Status',
        'FSSAI License No',
        'FSSAI Validity',
        'Mfg & Expiry Printed',
        'Shelf Life Guarantee',
        'Packaging Type & Seal',
        'Replacement Policy',
        '100% Inspection Allowed',
        'Product Categories Supplied',
        'Quality Grade',
        'Moisture Content Level',
        'Sample Kits Terms',
        'Payment Timing',
        'Accepted Payment Modes',
        'Credit Facility',
        'Written Quotation SLA',
        'Written Return Terms',
        'MOQ',
        'Delivery Radius & Charges',
        'Quotation Rates / Notes'
      ];

      const rows = [headers.join(',')];

      wholesalersData.forEach(w => {
        const values = [
          w.submittedAt || '',
          w.firmName || '',
          w.personName || '',
          w.contactPhone || '',
          w.location || '',
          w.gstStatus || '',
          w.gstin || '',
          w.fssaiStatus || '',
          w.fssaiNumber || '',
          w.fssaiValidity || '',
          w.mfgExpiryDetails || '',
          w.shelfLifeGuarantee || '',
          w.batchAndSealedCondition || '',
          w.replacementPolicy || '',
          w.inspectionAllowed || '',
          (w.productVarieties || []).join('; '),
          w.qualityGrade || '',
          w.moistureContent || '',
          w.sampleKitAvailability || '',
          w.paymentTiming || '',
          (w.paymentModes || []).join('; '),
          w.creditFacility || '',
          w.writtenQuotation || '',
          w.writtenReturnTerms || '',
          w.moq || '',
          w.deliveryCoverage || '',
          w.notes || ''
        ].map(val => `"${String(val).replace(/"/g, '""')}"`);

        rows.push(values.join(','));
      });

      downloadFile(rows.join('\n'), `Mana_Community_Wholesale_Quotations_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
      showToast('📥 Wholesaler quotations exported to CSV');
    }
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  btnExportCsv?.addEventListener('click', exportCsv);

  // Print Executive Procurement Report
  btnPrintReport?.addEventListener('click', () => {
    window.print();
  });

  // Clear all data
  btnClearAll?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all locally cached survey responses and quotations? Note: To delete cloud records permanently, delete them via Firebase console.')) {
      residentsData = [];
      wholesalersData = [];
      FirebaseService.saveLocalResidents([]);
      FirebaseService.saveLocalWholesalers([]);
      updateApartmentFilterOptions();
      renderMetrics();
      renderAnalyticsCharts();
      renderResidentsTable();
      renderWholesalersTable();
      updateBadges();
      showToast('🧹 Local cache cleared successfully');
    }
  });

  // Toast Notification
  function showToast(msg) {
    if (!adminToast) return;
    adminToast.textContent = msg;
    adminToast.classList.add('show');
    setTimeout(() => {
      adminToast.classList.remove('show');
    }, 3200);
  }

  // Demo data generator with rich resident responses and comprehensive wholesale quotes
  btnSeedDemo?.addEventListener('click', () => {
    const sampleResidents = [
      {
        id: 'demo-1',
        submittedAt: 'Today, 10:15 AM',
        apartmentName: 'Prestige Lakeside Habitat',
        flatNumber: 'Tower 4, 1202',
        personName: 'Ramesh Sharma',
        contactNumber: '9876543210',
        willingness: 'Yes, Definitely',
        whereBuy: ['Supermarkets / Retail shops', 'Online grocery apps'],
        itemsBought: ['Rice', 'Dal', 'Pulses', 'Atta', 'Oil'],
        otherItems: 'Almonds and organic jaggery',
        monthlySpending: '₹10,000 – ₹15,000 / month',
        purchaseFrequency: 'Once a week',
        serviceProducts: ['Farm-Fresh Vegetables & Fruits (Direct from farmers)', 'Monthly Staples Box (Rice, Dal, Atta, Grains)', 'Pure Cold-Pressed Oils & Desi Ghee'],
        problemsFaced: ['High prices and lack of wholesale discounts', 'Poor freshness or degraded quality of vegetables'],
        otherProblems: '',
        deliveryMethod: 'Direct Doorstep Delivery to Flat',
        tryMonthlyService: 'Definitely Yes',
        otherSuggestions: 'Looking for authentic BPT / Sona Masoori raw rice and cold-pressed sesame oil.'
      },
      {
        id: 'demo-2',
        submittedAt: 'Today, 11:30 AM',
        apartmentName: 'My Home Bhooja',
        flatNumber: 'Block C, 804',
        personName: 'Priya Reddy',
        contactNumber: '9848022338',
        willingness: 'Yes, Definitely',
        whereBuy: ['Supermarkets / Retail shops', 'Wholesale markets'],
        itemsBought: ['Rice', 'Dal', 'Ghee', 'Spices & Masalas'],
        otherItems: 'Cold-pressed gingelly oil',
        monthlySpending: 'Above ₹15,000 / month',
        purchaseFrequency: '2 – 3 times a week',
        serviceProducts: ['Farm-Fresh Vegetables & Fruits (Direct from farmers)', 'Pure Cold-Pressed Oils & Desi Ghee', 'Daily Dairy, Eggs & Bakery Essentials'],
        problemsFaced: ['Poor freshness or degraded quality of vegetables', 'Doubt over food purity and chemicals/pesticides'],
        otherProblems: 'Excessive plastic packaging from online quick-commerce apps',
        deliveryMethod: 'Early Morning Slot (6:30 AM - 8:30 AM)',
        tryMonthlyService: 'Yes, if prices are 15-20% lower than retail',
        otherSuggestions: 'A2 Gir cow ghee and stone-ground organic wheat flour preference.'
      },
      {
        id: 'demo-3',
        submittedAt: 'Yesterday, 04:20 PM',
        apartmentName: 'Rainbow Vistas Rock Garden',
        flatNumber: 'Daisy Block 301',
        personName: 'Suresh Kumar',
        contactNumber: '9988776655',
        willingness: 'Maybe / Depends on Price & Quality',
        whereBuy: ['Online grocery apps'],
        itemsBought: ['Dal', 'Atta', 'Grains', 'Cleaning', 'Snacks'],
        otherItems: 'Oats, Millets',
        monthlySpending: '₹6,000 – ₹10,000 / month',
        purchaseFrequency: 'Daily or Alternate Days',
        serviceProducts: ['Monthly Staples Box (Rice, Dal, Atta, Grains)'],
        problemsFaced: ['Frequent out-of-stock items and missing orders', 'Heavy bag lifting and traffic / checkout lines'],
        otherProblems: '',
        deliveryMethod: 'Community Clubhouse / Gate Pick-up Point',
        tryMonthlyService: 'Interested in a 1-month trial box first',
        otherSuggestions: 'Provide transparent sample bags before our society orders in bulk.'
      },
      {
        id: 'demo-4',
        submittedAt: 'Yesterday, 06:45 PM',
        apartmentName: 'Aparna Sarovar Zenith',
        flatNumber: 'Tower G, 1503',
        personName: 'Ananya Deshmukh',
        contactNumber: '9701122334',
        willingness: 'Yes, Definitely',
        whereBuy: ['Supermarkets / Retail shops', 'Online grocery apps'],
        itemsBought: ['Rice', 'Dal', 'Oil', 'Ghee', 'Spices & Masalas'],
        otherItems: 'Unpolished Toor Dal',
        monthlySpending: '₹10,000 – ₹15,000 / month',
        purchaseFrequency: 'Once a week',
        serviceProducts: ['Farm-Fresh Vegetables & Fruits (Direct from farmers)', 'Monthly Staples Box (Rice, Dal, Atta, Grains)', 'Organic / Pesticide-free Certified Groceries'],
        problemsFaced: ['High prices and lack of wholesale discounts', 'Doubt over food purity and chemicals/pesticides'],
        otherProblems: '',
        deliveryMethod: 'Evening Slot (6:00 PM - 9:00 PM)',
        tryMonthlyService: 'Definitely Yes',
        otherSuggestions: 'Can we have a society WhatsApp group for weekly order consolidation?'
      }
    ];

    const sampleWholesalers = [
      {
        id: 'demo-ws-1',
        submittedAt: 'Today, 09:00 AM',
        firmName: 'Sri Venkateshwara Grains & Oil Traders',
        personName: 'Ramesh Reddy (Proprietor)',
        contactPhone: '9849012345',
        location: 'Begum Bazaar Mandi, Hyderabad',
        gstStatus: 'Yes, Regular B2B Tax Invoice with Input Tax Credit (ITC)',
        gstin: '36AAAAA1234A1Z5',
        fssaiStatus: 'Valid Central / State FSSAI License',
        fssaiNumber: '13621014000123',
        fssaiValidity: '2028',
        mfgExpiryDetails: 'Yes, Clearly printed on every retail packet & bag',
        shelfLifeGuarantee: 'At least 6 months remaining before expiry',
        batchAndSealedCondition: 'Factory machine-sealed moisture-barrier woven sacks',
        replacementPolicy: '100% Immediate Replacement or Instant Full Refund within 24-48 Hours',
        inspectionAllowed: 'Yes (100% Inspection Allowed)',
        items: [
          { id: 'it-1', name: '🌾 Sona Masoori Rice (Old Crop)', unit: '26 kg Bag', pricePerKg: '54.60', price: '1420', wholesaleQty: '2 Bags (52 kg)', bulkPrice: '1360', bulkQty: '20 Bags (520 kg)', note: '100% Sortex Cleaned / Grade A' },
          { id: 'it-2', name: '🌾 Basmati Rice (1121 Steam)', unit: 'Per kg', pricePerKg: '110', price: '110', wholesaleQty: '25 kg', bulkPrice: '104', bulkQty: '100 kg', note: 'Aged 2 Years' },
          { id: 'it-3', name: '🥣 Toor Dal (Fatka / Desi Unpolished)', unit: 'Per kg', pricePerKg: '138', price: '138', wholesaleQty: '25 kg', bulkPrice: '130', bulkQty: '100 kg', note: 'Unpolished Sortex' },
          { id: 'it-4', name: '🫘 Moong Dal & Urad Dal', unit: 'Per kg', pricePerKg: '125', price: '125', wholesaleQty: '20 kg', bulkPrice: '118', bulkQty: '100 kg', note: 'Sortex Cleaned' },
          { id: 'it-5', name: '🌾 Whole Wheat & Fresh Atta', unit: 'Per kg', pricePerKg: '42', price: '42', wholesaleQty: '30 kg', bulkPrice: '39', bulkQty: '150 kg', note: 'Sharbati MP Wheat' },
          { id: 'it-6', name: '🫒 Wood-Pressed Groundnut Oil', unit: '5 Litre Tin', pricePerKg: '190', price: '950', wholesaleQty: '4 Tins (20 L)', bulkPrice: '900', bulkQty: '20 Tins (100 L)', note: 'Pure Cold-Pressed' },
          { id: 'it-7', name: '🧈 Pure Desi Cow Ghee', unit: '1 Litre Bottle', pricePerKg: '650', price: '650', wholesaleQty: '6 Bottles', bulkPrice: '615', bulkQty: '24 Bottles', note: 'Danedar Desi Ghee' }
        ],
        productVarieties: ['Sona Masoori Rice (₹54.60/kg | ₹1,420 / 26kg [Min: 2 Bags] | Bulk: ₹1,360 [Min: 20 Bags])', 'Basmati Rice (₹110/kg [Min: 25 kg] | Bulk: ₹104)', 'Toor Dal (₹138/kg [Min: 25 kg] | Bulk: ₹130)', 'Moong Dal & Urad Dal (₹125/kg [Min: 20 kg] | Bulk: ₹118)', 'Whole Wheat & Atta (₹42/kg [Min: 30 kg] | Bulk: ₹39)', 'Groundnut Oil (₹190/kg | ₹950 / 5L [Min: 4 Tins] | Bulk: ₹900)', 'Desi Cow Ghee (₹650 / 1L [Min: 6 Bottles] | Bulk: ₹615)'],
        qualityGrade: '100% Sortex Cleaned & Double-Polished / Grade A',
        moistureContent: 'Under 12% Moisture (Certified Safe Long Storage)',
        sampleKitAvailability: 'Yes, Free sample kits delivered to apartment committee',
        paymentTiming: 'Payment upon Delivery (POD) after verification',
        paymentModes: ['UPI / QR Code (PhonePe, GPay, Paytm)', 'Bank Transfer (NEFT / RTGS / IMPS Current A/c)', 'Account Payee Cheque'],
        creditFacility: 'Strictly delivery payment initially; 7-15 days credit negotiable after regular monthly volume',
        writtenQuotation: 'Yes, Official signed/stamped PDF quotation with itemized rates & validity',
        writtenReturnTerms: 'Yes, Written return/refund terms & SLA provided on company letterhead',
        moq: '300 kg minimum or ₹20,000 community order value',
        deliveryCoverage: 'Free doorstep delivery across Gachibowli, Kondapur, Madhapur & Financial District',
        notes: 'Current Mandi Bulk Rates (ex-godown):\n• Sona Masoori 26kg bag @ ₹1,420 (₹54.6/kg)\n• Desi Unpolished Fatka Toor Dal @ ₹138/kg\n• Fresh Stone-ground Whole Wheat Atta @ ₹42/kg\n• Cold-Pressed Groundnut Oil 5L tin @ ₹950\nFree sample bags (500g each) can be dispatched immediately to any gated society RWA.'
      },
      {
        id: 'demo-ws-2',
        submittedAt: 'Yesterday, 02:15 PM',
        firmName: 'Hyderabad Agro Farm Millers & Distributors',
        personName: 'K. Satyanarayana (Sales Manager)',
        contactPhone: '9866123456',
        location: 'Malakpet Gunj Mandi, Hyderabad',
        gstStatus: 'Yes, Regular B2B Tax Invoice with Input Tax Credit (ITC)',
        gstin: '36BBDCC5678B2Z9',
        fssaiStatus: 'Valid Central / State FSSAI License',
        fssaiNumber: '13619012000542',
        fssaiValidity: '2027',
        mfgExpiryDetails: 'Yes, Clearly printed on every retail packet & bag',
        shelfLifeGuarantee: 'Fresh milled / packaged within last 15-30 days',
        batchAndSealedCondition: 'Vacuum-sealed / food-grade nitrogen flushed pouches',
        replacementPolicy: '100% Immediate Replacement or Instant Full Refund within 24-48 Hours',
        inspectionAllowed: 'Yes (100% Inspection Allowed)',
        items: [
          { id: 'it-21', name: '🌾 Sona Masoori Rice (Aged 12M)', unit: '26 kg Bag', pricePerKg: '53.46', price: '1390', wholesaleQty: '2 Bags (52 kg)', bulkPrice: '1340', bulkQty: '25 Bags (650 kg)', note: 'Direct Kurnool Mill' },
          { id: 'it-22', name: '🌾 Basmati Rice (Classic)', unit: 'Per kg', pricePerKg: '105', price: '105', wholesaleQty: '25 kg', bulkPrice: '99', bulkQty: '100 kg', note: 'Extra Long Grain' },
          { id: 'it-23', name: '🥣 Toor Dal (Desi Fatka)', unit: 'Per kg', pricePerKg: '136', price: '136', wholesaleQty: '25 kg', bulkPrice: '130', bulkQty: '100 kg', note: 'Unpolished Fatka' },
          { id: 'it-24', name: '🧆 Chana Dal & Whole Chana', unit: 'Per kg', pricePerKg: '92', price: '92', wholesaleQty: '25 kg', bulkPrice: '88', bulkQty: '100 kg', note: 'Double Sortex' }
        ],
        productVarieties: ['Sona Masoori Rice (₹53.46/kg | ₹1,390 / 26kg | Bulk: ₹1,340)', 'Basmati Rice (₹105/kg | Bulk: ₹99)', 'Toor Dal (₹136/kg | Bulk: ₹130)', 'Chana Dal (₹92/kg | Bulk: ₹88)'],
        qualityGrade: '100% Sortex Cleaned & Double-Polished / Grade A',
        moistureContent: 'Under 12% Moisture (Certified Safe Long Storage)',
        sampleKitAvailability: 'Yes, Free sample kits delivered to apartment committee',
        paymentTiming: '7 to 15 Days Credit Period for RWA / Gated Society',
        paymentModes: ['Bank Transfer (NEFT / RTGS / IMPS Current A/c)', 'Account Payee Cheque'],
        creditFacility: 'Yes, 7 to 10 days credit available with RWA purchase agreement',
        writtenQuotation: 'Yes, 30-day fixed price contract list for staples',
        writtenReturnTerms: 'Yes, Written return/refund terms & SLA provided on company letterhead',
        moq: '500 kg minimum order value',
        deliveryCoverage: 'Free delivery within 25 km of Hyderabad mandis',
      }
    ];

    residentsData = sampleResidents;
    wholesalersData = sampleWholesalers;
    FirebaseService.saveLocalResidents(sampleResidents);
    FirebaseService.saveLocalWholesalers(sampleWholesalers);
    updateApartmentFilterOptions();
    renderMetrics();
    renderAnalyticsCharts();
    renderResidentsTable();
    renderWholesalersTable();
    updateBadges();
    showToast('✨ Sample demonstration data generated successfully!');

    // Also push to Turso if configured
    if (typeof TursoService !== 'undefined' && TursoService.getConfig().authToken) {
      TursoService.syncLocalToTurso().catch(e => console.warn('Turso demo push:', e));
    }
  });

  // ==========================================
  // Turso Database Settings & Control Panel
  // Organization: https://app.turso.tech/kondareddy
  // ==========================================
  const btnTursoSettings = document.getElementById('btn-turso-settings');
  const tursoModal = document.getElementById('turso-settings-modal');
  const btnCloseTursoModal = document.getElementById('btn-close-turso-modal');
  const btnDismissTursoModal = document.getElementById('btn-dismiss-turso-modal');
  const tursoDbUrlInput = document.getElementById('turso-db-url');
  const tursoAuthTokenInput = document.getElementById('turso-auth-token');
  const btnToggleTursoToken = document.getElementById('btn-toggle-turso-token');
  const btnTursoTestSave = document.getElementById('btn-turso-test-save');
  const btnTursoInitTables = document.getElementById('btn-turso-init-tables');
  const btnTursoPushLocal = document.getElementById('btn-turso-push-local');
  const btnTursoFetchNow = document.getElementById('btn-turso-fetch-now');
  const tursoStatusBox = document.getElementById('turso-status-box');
  const tursoSyncPill = document.getElementById('turso-sync-pill');
  const tursoSyncLabel = document.getElementById('turso-sync-label');

  function updateTursoPill(state, text) {
    if (!tursoSyncPill) return;
    tursoSyncPill.className = 'sync-pill sync-pill-turso ' + (state || '');
    if (tursoSyncLabel) {
      tursoSyncLabel.textContent = text || 'Turso DB: Ready';
    }
  }

  function setTursoStatus(type, message) {
    if (!tursoStatusBox) return;
    tursoStatusBox.style.display = 'block';
    if (type === 'success') {
      tursoStatusBox.style.background = '#ecfdf5';
      tursoStatusBox.style.color = '#065f46';
      tursoStatusBox.style.border = '1px solid #a7f3d0';
      tursoStatusBox.innerHTML = `<strong>Success:</strong> ${message}`;
    } else if (type === 'error') {
      tursoStatusBox.style.background = '#fef2f2';
      tursoStatusBox.style.color = '#991b1b';
      tursoStatusBox.style.border = '1px solid #fecaca';
      tursoStatusBox.innerHTML = `<strong>Error:</strong> ${message}`;
    } else if (type === 'info') {
      tursoStatusBox.style.background = '#eff6ff';
      tursoStatusBox.style.color = '#1e40af';
      tursoStatusBox.style.border = '1px solid #bfdbfe';
      tursoStatusBox.innerHTML = `<span>⏳ ${message}</span>`;
    }
  }

  // Open Turso Settings Modal
  if (btnTursoSettings && tursoModal) {
    btnTursoSettings.addEventListener('click', () => {
      if (typeof TursoService !== 'undefined') {
        const cfg = TursoService.getConfig();
        if (tursoDbUrlInput) tursoDbUrlInput.value = cfg.url || 'https://survey-kondareddy.turso.io';
        if (tursoAuthTokenInput) tursoAuthTokenInput.value = cfg.authToken || '';
        
        if (cfg.authToken) {
          setTursoStatus('info', 'Credentials configured. Click "Test & Save Connection" to verify connection to kondareddy.');
        } else {
          setTursoStatus('info', 'Enter your Turso Auth Token from https://app.turso.tech/kondareddy to enable cloud SQL sync.');
        }
      }
      tursoModal.classList.add('active');
    });
  }

  // Close Turso Modal
  function closeTursoSettingsModal() {
    if (tursoModal) tursoModal.classList.remove('active');
  }
  if (btnCloseTursoModal) btnCloseTursoModal.addEventListener('click', closeTursoSettingsModal);
  if (btnDismissTursoModal) btnDismissTursoModal.addEventListener('click', closeTursoSettingsModal);

  // Toggle token password visibility
  if (btnToggleTursoToken && tursoAuthTokenInput) {
    btnToggleTursoToken.addEventListener('click', () => {
      const isPwd = tursoAuthTokenInput.type === 'password';
      tursoAuthTokenInput.type = isPwd ? 'text' : 'password';
      btnToggleTursoToken.textContent = isPwd ? '🔒' : '👁️';
    });
  }

  // Test & Save Connection
  if (btnTursoTestSave) {
    btnTursoTestSave.addEventListener('click', async () => {
      const url = tursoDbUrlInput ? tursoDbUrlInput.value.trim() : '';
      const token = tursoAuthTokenInput ? tursoAuthTokenInput.value.trim() : '';

      if (!token) {
        setTursoStatus('error', 'Auth Token cannot be empty. Copy it from https://app.turso.tech/kondareddy.');
        updateTursoPill('needs-config', 'Turso DB: Setup Credentials');
        return;
      }

      setTursoStatus('info', 'Connecting to Turso database and testing query...');
      btnTursoTestSave.disabled = true;

      try {
        TursoService.saveConfig({ url, authToken: token });
        const result = await TursoService.testConnection();

        if (result.success) {
          setTursoStatus('success', 'Connected successfully! Database tables (survey_responses, wholesaler_quotations) verified.');
          updateTursoPill('connected', 'Turso DB: Connected (kondareddy)');
          showToast('✅ Turso Database connected successfully!');
          
          // Pull fresh records
          const [resList, wsList] = await Promise.all([
            TursoService.fetchResidents(),
            TursoService.fetchWholesalers()
          ]);
          onResidentsUpdate(resList);
          onWholesalersUpdate(wsList);
        } else {
          setTursoStatus('error', result.error);
          updateTursoPill('error', 'Turso DB: Connection Failed');
          showToast('❌ Turso connection failed: ' + result.error);
        }
      } catch (err) {
        setTursoStatus('error', err.message);
        updateTursoPill('error', 'Turso DB: Connection Error');
        showToast('❌ Turso error: ' + err.message);
      } finally {
        btnTursoTestSave.disabled = false;
      }
    });
  }

  // Initialize Tables
  if (btnTursoInitTables) {
    btnTursoInitTables.addEventListener('click', async () => {
      setTursoStatus('info', 'Initializing database tables in Turso...');
      btnTursoInitTables.disabled = true;
      try {
        await TursoService.initTables();
        setTursoStatus('success', 'Tables "survey_responses" and "wholesaler_quotations" are verified and ready.');
        showToast('🏗️ Turso SQL tables initialized!');
      } catch (e) {
        setTursoStatus('error', 'Table initialization failed: ' + e.message);
      } finally {
        btnTursoInitTables.disabled = false;
      }
    });
  }

  // Push Local Data to Turso
  if (btnTursoPushLocal) {
    btnTursoPushLocal.addEventListener('click', async () => {
      setTursoStatus('info', 'Pushing local and demo records into Turso database...');
      btnTursoPushLocal.disabled = true;
      try {
        const res = await TursoService.syncLocalToTurso();
        setTursoStatus('success', `Synced ${res.count} records to Turso libSQL database successfully.`);
        showToast(`⬆️ Pushed ${res.count} records to Turso!`);
      } catch (e) {
        setTursoStatus('error', 'Sync to Turso failed: ' + e.message);
      } finally {
        btnTursoPushLocal.disabled = false;
      }
    });
  }

  // Pull Remote Data Now
  if (btnTursoFetchNow) {
    btnTursoFetchNow.addEventListener('click', async () => {
      setTursoStatus('info', 'Fetching latest records from Turso database...');
      btnTursoFetchNow.disabled = true;
      try {
        const [resList, wsList] = await Promise.all([
          TursoService.fetchResidents(),
          TursoService.fetchWholesalers()
        ]);
        onResidentsUpdate(resList);
        onWholesalersUpdate(wsList);
        setTursoStatus('success', `Fetched ${resList.length} resident responses and ${wsList.length} wholesaler quotations.`);
        showToast(`⬇️ Fetched fresh records from Turso!`);
      } catch (e) {
        setTursoStatus('error', 'Fetch from Turso failed: ' + e.message);
      } finally {
        btnTursoFetchNow.disabled = false;
      }
    });
  }

  // Check initial Turso status on startup
  if (typeof TursoService !== 'undefined') {
    const initialConfig = TursoService.getConfig();
    if (initialConfig.authToken) {
      updateTursoPill('', 'Turso DB: Connecting...');
      TursoService.testConnection().then(res => {
        if (res.success) {
          updateTursoPill('connected', 'Turso DB: Connected (kondareddy)');
        } else {
          updateTursoPill('needs-config', 'Turso DB: Check Credentials');
        }
      }).catch(() => {
        updateTursoPill('needs-config', 'Turso DB: Offline');
      });
    } else {
      updateTursoPill('needs-config', 'Turso DB: Setup Credentials');
    }
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
