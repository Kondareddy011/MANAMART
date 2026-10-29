/**
 * Mana Community Grocery Survey - Client Logic & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Navigation & Switcher
  const brandLogoTrigger = document.getElementById('brand-logo-trigger');
  const tabBtnCommunities = document.getElementById('tab-btn-communities');
  const tabBtnWholesalers = document.getElementById('tab-btn-wholesalers');
  const responseCountBadge = document.getElementById('response-count-badge');

  // Hero elements
  const heroTitle = document.getElementById('hero-title');
  const heroDesc = document.getElementById('hero-desc');
  const heroMetaStrip = document.getElementById('hero-meta-strip');
  const surveyProgressWrap = document.getElementById('survey-progress-wrap');
  const progressBar = document.getElementById('progress-bar');
  const progressPercent = document.getElementById('progress-percent');

  // Containers
  const formContainer = document.getElementById('form-container');
  const grocerySurveyForm = document.getElementById('grocery-survey-form');
  const wholesalerEmbeddedContainer = document.getElementById('wholesaler-embedded-container');
  const wholesalerForm = document.getElementById('wholesaler-inpage-form');
  const successScreen = document.getElementById('success-screen');

  // Resident Form Controls
  const btnReset = document.getElementById('btn-reset');
  const btnSubmit = document.getElementById('btn-submit');
  const btnFillAnother = document.getElementById('btn-fill-another');
  const btnViewDataFromSuccess = document.getElementById('btn-view-data-from-success');

  // Wholesaler Controls
  const btnSubmitWholesaler = document.getElementById('btn-submit-wholesaler');
  const btnWaWholesaler = document.getElementById('btn-wa-wholesaler');
  const btnPrintWholesaler = document.getElementById('btn-print-wholesaler');

  // Toast
  const adminToast = document.getElementById('admin-toast');

  // Update response badge from storage
  function updateBadge() {
    const list = FirebaseService.getLocalResidents();
    if (responseCountBadge) {
      responseCountBadge.textContent = list.length;
    }
  }

  // Real-time updates subscription
  FirebaseService.subscribeResidents(() => {
    updateBadge();
  });

  // Tab Switcher Logic
  function switchPortalTab(tab) {
    if (tab === 'wholesalers') {
      tabBtnWholesalers?.classList.add('active');
      tabBtnWholesalers?.setAttribute('aria-selected', 'true');
      tabBtnCommunities?.classList.remove('active');
      tabBtnCommunities?.setAttribute('aria-selected', 'false');

      grocerySurveyForm?.classList.add('hidden');
      surveyProgressWrap?.classList.add('hidden');
      wholesalerEmbeddedContainer?.classList.remove('hidden');

      if (heroTitle) heroTitle.textContent = 'Wholesale Supplier Quality & Business Terms';
      if (heroDesc) heroDesc.textContent = 'B2B Questionnaire for grain merchants, millers, and wholesale distributors supplying apartment communities in Hyderabad & Telangana mandis.';
      if (heroMetaStrip) {
        heroMetaStrip.innerHTML = '<span>💼 B2B Quotation Form</span><span>🛡️ GST & FSSAI Compliant</span><span>⚡ Direct Society Onboarding</span>';
      }
      window.location.hash = 'wholesalers';
    } else {
      tabBtnCommunities?.classList.add('active');
      tabBtnCommunities?.setAttribute('aria-selected', 'true');
      tabBtnWholesalers?.classList.remove('active');
      tabBtnWholesalers?.setAttribute('aria-selected', 'false');

      grocerySurveyForm?.classList.remove('hidden');
      surveyProgressWrap?.classList.remove('hidden');
      wholesalerEmbeddedContainer?.classList.add('hidden');

      if (heroTitle) heroTitle.textContent = 'Apartment Grocery Needs & Preferences';
      if (heroDesc) heroDesc.textContent = "We are assessing interest in a direct-from-source, farm-fresh community grocery service offering wholesale pricing and direct delivery for apartment residents. Please share your family's preferences below.";
      if (heroMetaStrip) {
        heroMetaStrip.innerHTML = '<span>⏱️ 2 minutes</span><span>🔒 Confidential & Community-focused</span><span>✨ Exclusive community discounts</span>';
      }
      history.replaceState(null, null, ' ');
      renderCommunityWholesaleItems();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabBtnCommunities?.addEventListener('click', () => switchPortalTab('communities'));
  tabBtnWholesalers?.addEventListener('click', () => switchPortalTab('wholesalers'));

  // Live Progress Calculation
  function updateProgress() {
    if (!grocerySurveyForm) return;
    let completed = 0;
    const totalRequired = 9;

    const apt = document.getElementById('apartment-name')?.value.trim();
    const person = document.getElementById('person-name')?.value.trim();
    const willing = grocerySurveyForm.querySelector('input[name="willingness"]:checked');
    const whereBuy = grocerySurveyForm.querySelectorAll('input[name="whereBuy"]:checked');
    const items = grocerySurveyForm.querySelectorAll('input[name="itemsBought"]:checked');
    const otherItems = document.getElementById('other-items')?.value.trim();
    const spend = document.getElementById('monthly-spending')?.value;
    const freq = document.getElementById('purchase-frequency')?.value;
    const service = grocerySurveyForm.querySelectorAll('input[name="serviceProducts"]:checked');
    const delivery = grocerySurveyForm.querySelector('input[name="deliveryMethod"]:checked');

    if (apt) completed++;
    if (person) completed++;
    if (willing) completed++;
    if (whereBuy.length > 0) completed++;
    if (items.length > 0 || otherItems) completed++;
    if (spend) completed++;
    if (freq) completed++;
    if (service.length > 0) completed++;
    if (delivery) completed++;

    const pct = Math.round((completed / totalRequired) * 100);
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPercent) progressPercent.textContent = `${pct}%`;
  }

  grocerySurveyForm?.addEventListener('input', updateProgress);
  grocerySurveyForm?.addEventListener('change', updateProgress);

  // Validate Resident Form
  function validateResidentForm() {
    let isValid = true;
    document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-group, .form-section').forEach(el => el.classList.remove('has-error'));

    const aptInput = document.getElementById('apartment-name');
    if (!aptInput.value.trim()) {
      document.getElementById('err-apartment-name').style.display = 'block';
      aptInput.closest('.form-group')?.classList.add('has-error');
      if (isValid) aptInput.focus();
      isValid = false;
    }

    const nameInput = document.getElementById('person-name');
    if (!nameInput.value.trim()) {
      document.getElementById('err-person-name').style.display = 'block';
      nameInput.closest('.form-group')?.classList.add('has-error');
      if (isValid) nameInput.focus();
      isValid = false;
    }

    const willingness = grocerySurveyForm.querySelector('input[name="willingness"]:checked');
    if (!willingness) {
      document.getElementById('err-willingness').style.display = 'block';
      if (isValid) document.getElementById('err-willingness').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const whereBuy = grocerySurveyForm.querySelectorAll('input[name="whereBuy"]:checked');
    if (whereBuy.length === 0) {
      document.getElementById('err-where-buy').style.display = 'block';
      if (isValid) document.getElementById('err-where-buy').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const items = grocerySurveyForm.querySelectorAll('input[name="itemsBought"]:checked');
    const otherItems = document.getElementById('other-items')?.value.trim();
    const hasWholesaleItems = typeof communitySelectedWholesaleItems !== 'undefined' && communitySelectedWholesaleItems.size > 0;
    if (items.length === 0 && !otherItems && !hasWholesaleItems) {
      document.getElementById('err-items-bought').style.display = 'block';
      if (isValid) document.getElementById('err-items-bought').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const spending = document.getElementById('monthly-spending');
    if (!spending.value) {
      document.getElementById('err-monthly-spending').style.display = 'block';
      spending.closest('.form-group')?.classList.add('has-error');
      if (isValid) spending.focus();
      isValid = false;
    }

    const freq = document.getElementById('purchase-frequency');
    if (!freq.value) {
      document.getElementById('err-purchase-frequency').style.display = 'block';
      freq.closest('.form-group')?.classList.add('has-error');
      if (isValid) freq.focus();
      isValid = false;
    }

    const serviceProducts = grocerySurveyForm.querySelectorAll('input[name="serviceProducts"]:checked');
    if (serviceProducts.length === 0) {
      document.getElementById('err-service-products').style.display = 'block';
      if (isValid) document.getElementById('err-service-products').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const problems = grocerySurveyForm.querySelectorAll('input[name="problemsFaced"]:checked');
    const otherProblems = document.getElementById('other-problems')?.value.trim();
    if (problems.length === 0 && !otherProblems) {
      document.getElementById('err-problems-faced').style.display = 'block';
      if (isValid) document.getElementById('err-problems-faced').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const delivery = grocerySurveyForm.querySelector('input[name="deliveryMethod"]:checked');
    if (!delivery) {
      document.getElementById('err-delivery-method').style.display = 'block';
      if (isValid) document.getElementById('err-delivery-method').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    const tryMonthly = grocerySurveyForm.querySelector('input[name="tryMonthlyService"]:checked');
    if (!tryMonthly) {
      document.getElementById('err-monthly-service').style.display = 'block';
      if (isValid) document.getElementById('err-monthly-service').scrollIntoView({ behavior: 'smooth', block: 'center' });
      isValid = false;
    }

    return isValid;
  }

  // Get Resident Form Data
  function getResidentFormData() {
    const whereBuy = Array.from(grocerySurveyForm.querySelectorAll('input[name="whereBuy"]:checked')).map(el => el.value);
    const itemsBought = Array.from(grocerySurveyForm.querySelectorAll('input[name="itemsBought"]:checked')).map(el => el.value);
    const serviceProducts = Array.from(grocerySurveyForm.querySelectorAll('input[name="serviceProducts"]:checked')).map(el => el.value);
    const problemsFaced = Array.from(grocerySurveyForm.querySelectorAll('input[name="problemsFaced"]:checked')).map(el => el.value);
    const selectedWholesaleItems = typeof communitySelectedWholesaleItems !== 'undefined'
      ? Array.from(communitySelectedWholesaleItems.values())
      : [];

    // Also include selected wholesale items into itemsBought list
    selectedWholesaleItems.forEach(wsIt => {
      if (!itemsBought.includes(wsIt.name)) {
        itemsBought.push(wsIt.name);
      }
    });

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      submittedAt: dateFormatted,
      apartmentName: document.getElementById('apartment-name').value.trim(),
      flatNumber: document.getElementById('flat-number')?.value.trim() || '',
      personName: document.getElementById('person-name').value.trim(),
      contactNumber: document.getElementById('contact-number')?.value.trim() || '',
      willingness: grocerySurveyForm.querySelector('input[name="willingness"]:checked')?.value || '',
      whereBuy,
      itemsBought,
      selectedWholesaleItems,
      otherItems: document.getElementById('other-items')?.value.trim() || '',
      monthlySpending: document.getElementById('monthly-spending').value,
      purchaseFrequency: document.getElementById('purchase-frequency').value,
      serviceProducts,
      problemsFaced,
      otherProblems: document.getElementById('other-problems')?.value.trim() || '',
      deliveryMethod: grocerySurveyForm.querySelector('input[name="deliveryMethod"]:checked')?.value || '',
      tryMonthlyService: grocerySurveyForm.querySelector('input[name="tryMonthlyService"]:checked')?.value || '',
      otherSuggestions: document.getElementById('other-suggestions')?.value.trim() || ''
    };
  }

  // Render Submission Preview
  function renderSubmissionSummary(data) {
    const summaryBox = document.getElementById('submission-preview-box');
    const aptSpan = document.getElementById('success-apartment-name');
    if (aptSpan) aptSpan.textContent = data.apartmentName || 'Your Apartment';

    if (summaryBox) {
      summaryBox.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; font-size: 0.9rem;">
          <div><strong>Resident:</strong> ${escapeHtml(data.personName)} (${escapeHtml(data.flatNumber || 'Flat not specified')})</div>
          <div><strong>Community:</strong> ${escapeHtml(data.apartmentName)}</div>
          <div><strong>Willingness:</strong> <span class="badge-tag badge-green">${escapeHtml(data.willingness)}</span></div>
          <div><strong>Monthly Budget:</strong> ${escapeHtml(data.monthlySpending)}</div>
          <div><strong>Delivery Preference:</strong> ${escapeHtml(data.deliveryMethod)}</div>
          <div><strong>Monthly Trial Interest:</strong> ${escapeHtml(data.tryMonthlyService)}</div>
        </div>
        <div style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px dashed #cbd5e1; font-size: 0.84rem; color: #475569;">
          <strong>Products Selected for Community Sourcing:</strong> ${escapeHtml(data.serviceProducts.join(', '))}
        </div>
        ${data.selectedWholesaleItems && data.selectedWholesaleItems.length > 0 ? `
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #cbd5e1; font-size: 0.84rem; color: #0f172a;">
            <strong>🌾 Wholesale Mandi Staples Selected:</strong>
            <ul style="margin: 0.35rem 0 0 1.2rem; padding: 0; color: #0369a1; line-height: 1.5;">
              ${data.selectedWholesaleItems.map(it => `
                <li><strong>${escapeHtml(it.name)}</strong>: ${it.qty || 1} ${escapeHtml(it.unit || 'unit')} ${it.price ? `(₹${it.price} per ${it.unit})` : (it.pricePerKg ? `(₹${it.pricePerKg}/kg)` : '')}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      `;
    }
  }

  // Resident Form Submission
  grocerySurveyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateResidentForm()) return;

    const data = getResidentFormData();
    btnSubmit.disabled = true;
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = `<span>Submitting response...</span>`;

    try {
      await FirebaseService.submitResidentSurvey(data);
    } catch (err) {
      console.warn('Submission error:', err);
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }

    renderSubmissionSummary(data);
    formContainer?.classList.add('hidden');
    successScreen?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateBadge();
  });

  // Reset Form
  btnReset?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all inputs in the form?')) {
      grocerySurveyForm.reset();
      updateProgress();
      document.querySelectorAll('.field-error').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.form-group, .form-section').forEach(el => el.classList.remove('has-error'));
    }
  });

  // Fill another response
  btnFillAnother?.addEventListener('click', () => {
    grocerySurveyForm.reset();
    updateProgress();
    successScreen?.classList.add('hidden');
    formContainer?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // View collected responses
  btnViewDataFromSuccess?.addEventListener('click', () => {
    window.open('admin.html', '_blank') || (window.location.href = 'admin.html');
  });

  // Secret 3-Click Admin Portal on Logo
  let logoClicks = 0;
  let logoTimer = null;

  function showToast(msg) {
    if (!adminToast) return;
    adminToast.textContent = msg;
    adminToast.classList.add('admin-toast-show');
    setTimeout(() => {
      adminToast.classList.remove('admin-toast-show');
    }, 3200);
  }

  brandLogoTrigger?.addEventListener('click', () => {
    logoClicks++;
    clearTimeout(logoTimer);

    if (logoClicks >= 3) {
      logoClicks = 0;
      showToast('🔐 Opening Admin Portal...');
      setTimeout(() => {
        window.open('admin.html', '_blank') || (window.location.href = 'admin.html');
      }, 400);
    } else {
      logoTimer = setTimeout(() => {
        logoClicks = 0;
      }, 800);
    }
  });

  // ==========================================
  // Wholesalers Dynamic Rate Card & Items Manager
  // ==========================================
  function getDefaultQuantitiesForUnit(unit) {
    if (!unit) return { wsQty: '25 kg', bulkQty: '100 kg' };
    if (/26\s*kg/i.test(unit)) return { wsQty: '2 Bags (52 kg)', bulkQty: '20 Bags (520 kg)' };
    if (/50\s*kg/i.test(unit)) return { wsQty: '2 Bags (100 kg)', bulkQty: '10 Bags (500 kg)' };
    if (/5\s*litre/i.test(unit)) return { wsQty: '4 Tins (20 L)', bulkQty: '20 Tins (100 L)' };
    if (/1\s*litre/i.test(unit)) return { wsQty: '6 Bottles', bulkQty: '24 Bottles' };
    if (/15\s*kg/i.test(unit)) return { wsQty: '2 Tins (30 kg)', bulkQty: '10 Tins (150 kg)' };
    if (/quintal/i.test(unit)) return { wsQty: '1 Quintal (100 kg)', bulkQty: '5 Quintals (500 kg)' };
    return { wsQty: '25 kg', bulkQty: '100 kg' };
  }

  let wholesalerItems = [
    { id: 'ws-item-1', name: '🌾 Sona Masoori Rice (Old Crop)', unit: '26 kg Bag', pricePerKg: '54.60', price: '1420', wholesaleQty: '2 Bags (52 kg)', bulkPrice: '1360', bulkQty: '20 Bags (520 kg)', note: '100% Sortex Cleaned / Grade A' },
    { id: 'ws-item-2', name: '🌾 Basmati Rice (1121 Steam)', unit: 'Per kg', pricePerKg: '110', price: '110', wholesaleQty: '25 kg', bulkPrice: '104', bulkQty: '100 kg', note: 'Aged 2 Years' },
    { id: 'ws-item-3', name: '🥣 Toor Dal (Fatka / Desi Unpolished)', unit: 'Per kg', pricePerKg: '138', price: '138', wholesaleQty: '25 kg', bulkPrice: '130', bulkQty: '100 kg', note: 'Unpolished Sortex' },
    { id: 'ws-item-4', name: '🫘 Moong Dal & Urad Dal', unit: 'Per kg', pricePerKg: '125', price: '125', wholesaleQty: '20 kg', bulkPrice: '118', bulkQty: '100 kg', note: 'Sortex Cleaned' },
    { id: 'ws-item-5', name: '🌾 Whole Wheat & Fresh Atta', unit: 'Per kg', pricePerKg: '42', price: '42', wholesaleQty: '30 kg', bulkPrice: '39', bulkQty: '150 kg', note: 'Sharbati MP Wheat' },
    { id: 'ws-item-6', name: '🫒 Wood-Pressed Groundnut Oil', unit: '5 Litre Tin', pricePerKg: '190', price: '950', wholesaleQty: '4 Tins (20 L)', bulkPrice: '900', bulkQty: '20 Tins (100 L)', note: 'Pure Cold-Pressed' },
    { id: 'ws-item-7', name: '🧈 Pure Desi Cow Ghee', unit: '1 Litre Bottle', pricePerKg: '650', price: '650', wholesaleQty: '6 Bottles', bulkPrice: '615', bulkQty: '24 Bottles', note: 'Danedar Desi Ghee' }
  ];

  // Community Wholesale Selection Map
  const communitySelectedWholesaleItems = new Map();
  const communityWsContainer = document.getElementById('community-wholesale-items-container');
  const communityWsLiveCount = document.getElementById('community-ws-live-count');
  const itemsChipsContainer = document.getElementById('items-chips');

  function loadPersistedWholesalerItems() {
    try {
      const saved = localStorage.getItem('mana_wholesaler_catalog_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          wholesalerItems = parsed.map(it => {
            const def = wholesalerItems.find(d => d.id === it.id);
            const fallbackQty = getDefaultQuantitiesForUnit(it.unit);
            return {
              ...it,
              bulkPrice: it.bulkPrice !== undefined ? it.bulkPrice : (def ? def.bulkPrice : (it.price ? String(Math.round(parseFloat(it.price) * 0.95)) : '')),
              wholesaleQty: it.wholesaleQty !== undefined ? it.wholesaleQty : (def && def.wholesaleQty ? def.wholesaleQty : fallbackQty.wsQty),
              bulkQty: it.bulkQty !== undefined ? it.bulkQty : (def && def.bulkQty ? def.bulkQty : fallbackQty.bulkQty)
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error reading saved wholesaler catalog:', e);
    }
  }

  function persistWholesalerItems() {
    try {
      localStorage.setItem('mana_wholesaler_catalog_v1', JSON.stringify(wholesalerItems));
    } catch (e) {}
    renderCommunityWholesaleItems();
  }

  loadPersistedWholesalerItems();

  const quickAddCatalog = [
    { name: '🧆 Chana Dal & Whole Chana', unit: 'Per kg', defaultPriceKg: '95', defaultPrice: '95', defaultWholesaleQty: '25 kg', defaultBulkPrice: '90', defaultBulkQty: '100 kg', note: 'Mandi Cleaned' },
    { name: '🍯 Organic Jaggery / Bellam', unit: 'Per kg', defaultPriceKg: '65', defaultPrice: '65', defaultWholesaleQty: '20 kg', defaultBulkPrice: '60', defaultBulkQty: '80 kg', note: 'Chemical-Free Block' },
    { name: '🥜 Raw Peanuts / Groundnuts', unit: 'Per kg', defaultPriceKg: '120', defaultPrice: '120', defaultWholesaleQty: '25 kg', defaultBulkPrice: '114', defaultBulkQty: '100 kg', note: 'Bold Pods' },
    { name: '🌾 Foxtail / Little Millets', unit: 'Per kg', defaultPriceKg: '85', defaultPrice: '85', defaultWholesaleQty: '20 kg', defaultBulkPrice: '80', defaultBulkQty: '100 kg', note: 'Unpolished Millets' },
    { name: '🌶️ Guntur Red Chilli & Spices', unit: 'Per kg', defaultPriceKg: '260', defaultPrice: '260', defaultWholesaleQty: '10 kg', defaultBulkPrice: '245', defaultBulkQty: '50 kg', note: 'Stemless Teja Chilli' }
  ];

  const wsItemsTableBody = document.getElementById('ws-items-table-body');
  const quickAddChipsContainer = document.getElementById('quick-add-chips');
  const btnAddWsItem = document.getElementById('btn-add-ws-item');

  const availableUnits = [
    '26 kg Bag',
    '50 kg Bag',
    'Per kg',
    '5 Litre Tin',
    '1 Litre Bottle',
    '15 kg Tin',
    'Quintal (100 kg)',
    'Custom Unit'
  ];

  function getUnitMultiplier(unitStr) {
    if (!unitStr) return 1;
    const match = unitStr.match(/^(\d+(?:\.\d+)?)\s*(?:kg|litre|l|tin|bag)/i);
    if (match) return parseFloat(match[1]);
    if (/quintal/i.test(unitStr)) return 100;
    return 1;
  }

  function renderWholesalerItemsTable() {
    if (!wsItemsTableBody) return;
    wsItemsTableBody.innerHTML = '';

    if (wholesalerItems.length === 0) {
      wsItemsTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2.5rem 1rem; color: #94a3b8;">
            No items in quotation yet. Click <strong>"+ Add Custom Product"</strong> or click any of the Quick Add items above to build your rate card.
          </td>
        </tr>
      `;
      return;
    }

    wholesalerItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.setAttribute('data-id', item.id);
      if (item.isEditing) tr.classList.add('row-editing');

      const unitOptionsHtml = availableUnits.map(u => 
        `<option value="${escapeHtml(u)}" ${item.unit === u ? 'selected' : ''}>${escapeHtml(u)}</option>`
      ).join('');

      const nameHtml = (item.isEditing || item.isCustom)
        ? `<input type="text" class="item-name-input" data-id="${item.id}" value="${escapeHtml(item.name || '')}" placeholder="Enter product name..." style="width: 100%; min-width: 140px; padding: 0.5rem 0.65rem; border: 1.5px solid ${item.isEditing ? '#0284c7' : '#cbd5e1'}; border-radius: 8px; font-size: 0.88rem; font-weight: 600; background: #ffffff;" aria-label="Product Name">`
        : `<span class="item-name-text btn-trigger-edit" data-id="${item.id}" id="name-display-${item.id}" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;" title="Click to edit name">${escapeHtml(item.name)} <span style="font-size: 0.75rem; color: #94a3b8; opacity: 0.7;">✏️</span></span>`;

      const actionBtnHtml = item.isEditing
        ? `<button type="button" class="btn-item-action save btn-save-item" data-id="${item.id}" title="Done / Save product name">✓</button>`
        : `<button type="button" class="btn-item-action edit btn-edit-item" data-id="${item.id}" title="Edit product name & details">✏️</button>`;

      tr.innerHTML = `
        <td>
          <div class="item-name-cell">
            ${nameHtml}
          </div>
        </td>
        <td>
          <select class="item-unit-select" data-id="${item.id}" aria-label="Select packaging unit">
            ${unitOptionsHtml}
          </select>
        </td>
        <td>
          <div class="item-price-kg-input-wrap">
            <span class="item-price-kg-prefix">₹</span>
            <input type="number" class="item-price-kg-input" data-id="${item.id}" value="${item.pricePerKg || ''}" placeholder="1 kg rate" min="0" step="any" aria-label="Price of 1 kg in rupees">
          </div>
        </td>
        <td>
          <div class="item-price-input-wrap">
            <span class="item-price-prefix">₹</span>
            <input type="number" class="item-price-input" data-id="${item.id}" value="${item.price || ''}" placeholder="Wholesale rate" min="0" step="any" aria-label="Wholesale package price in rupees">
          </div>
        </td>
        <td>
          <div class="item-qty-input-wrap">
            <input type="text" class="item-ws-qty-input" data-id="${item.id}" value="${escapeHtml(item.wholesaleQty || '')}" placeholder="e.g. 2 Bags / 50 kg" aria-label="Wholesale minimum order quantity">
          </div>
        </td>
        <td>
          <div class="item-bulk-price-input-wrap">
            <span class="item-bulk-price-prefix">₹</span>
            <input type="number" class="item-bulk-price-input" data-id="${item.id}" value="${item.bulkPrice || ''}" placeholder="Bulk / MOQ rate" min="0" step="any" aria-label="Bulk order price in rupees">
          </div>
        </td>
        <td>
          <div class="item-qty-input-wrap">
            <input type="text" class="item-bulk-qty-input" data-id="${item.id}" value="${escapeHtml(item.bulkQty || '')}" placeholder="e.g. 20 Bags / 500 kg" aria-label="Bulk order minimum quantity">
          </div>
        </td>
        <td>
          <input type="text" class="item-note-input" data-id="${item.id}" value="${escapeHtml(item.note || '')}" placeholder="e.g. Sortex Cleaned / Grade A" aria-label="Quality grade or variety note">
        </td>
        <td style="text-align: center;">
          <div class="item-actions-cell">
            ${actionBtnHtml}
            <button type="button" class="btn-item-action remove btn-remove-item" data-id="${item.id}" title="Remove this item">🗑️</button>
          </div>
        </td>
      `;

      wsItemsTableBody.appendChild(tr);
    });

    // Bind Price of 1 kg input change with smart sync
    wsItemsTableBody.querySelectorAll('.item-price-kg-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        const val = e.target.value.trim();
        it.pricePerKg = val;

        const mult = getUnitMultiplier(it.unit);
        if (mult === 1) {
          it.price = val;
          const wholesaleInp = wsItemsTableBody.querySelector(`.item-price-input[data-id="${id}"]`);
          if (wholesaleInp) wholesaleInp.value = val;
        } else if (val) {
          const calcWholesale = Math.round(parseFloat(val) * mult);
          it.price = String(calcWholesale);
          const wholesaleInp = wsItemsTableBody.querySelector(`.item-price-input[data-id="${id}"]`);
          if (wholesaleInp) wholesaleInp.value = it.price;
        }
        persistWholesalerItems();
      });
    });

    // Bind Wholesale Package Price input change with smart 1 kg calculation and bulk suggestion
    wsItemsTableBody.querySelectorAll('.item-price-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        const val = e.target.value.trim();
        it.price = val;

        const mult = getUnitMultiplier(it.unit);
        if (val && mult > 0) {
          const perKg = (parseFloat(val) / mult);
          const formatted = Number.isInteger(perKg) ? String(perKg) : perKg.toFixed(2).replace(/\.00$/, '');
          it.pricePerKg = formatted;
          const kgInp = wsItemsTableBody.querySelector(`.item-price-kg-input[data-id="${id}"]`);
          if (kgInp) kgInp.value = formatted;

          if (!it.bulkPrice) {
            it.bulkPrice = String(Math.round(parseFloat(val) * 0.95));
            const bulkInp = wsItemsTableBody.querySelector(`.item-bulk-price-input[data-id="${id}"]`);
            if (bulkInp) bulkInp.value = it.bulkPrice;
          }
        } else if (!val) {
          it.pricePerKg = '';
          const kgInp = wsItemsTableBody.querySelector(`.item-price-kg-input[data-id="${id}"]`);
          if (kgInp) kgInp.value = '';
        }
        persistWholesalerItems();
      });
    });

    // Bind Wholesale Min Qty input change
    wsItemsTableBody.querySelectorAll('.item-ws-qty-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.wholesaleQty = e.target.value.trim();
        persistWholesalerItems();
      });
    });

    // Bind Bulk Order Price input change
    wsItemsTableBody.querySelectorAll('.item-bulk-price-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.bulkPrice = e.target.value.trim();
        persistWholesalerItems();
      });
    });

    // Bind Bulk Order Min Qty input change
    wsItemsTableBody.querySelectorAll('.item-bulk-qty-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.bulkQty = e.target.value.trim();
        persistWholesalerItems();
      });
    });

    // Bind unit select change
    wsItemsTableBody.querySelectorAll('.item-unit-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.unit = e.target.value;
        const mult = getUnitMultiplier(it.unit);
        if (it.pricePerKg && mult > 0) {
          const calcWholesale = Math.round(parseFloat(it.pricePerKg) * mult);
          it.price = String(calcWholesale);
          const wholesaleInp = wsItemsTableBody.querySelector(`.item-price-input[data-id="${id}"]`);
          if (wholesaleInp) wholesaleInp.value = it.price;
        }
        const qts = getDefaultQuantitiesForUnit(it.unit);
        if (!it.wholesaleQty) {
          it.wholesaleQty = qts.wsQty;
          const wqInp = wsItemsTableBody.querySelector(`.item-ws-qty-input[data-id="${id}"]`);
          if (wqInp) wqInp.value = it.wholesaleQty;
        }
        if (!it.bulkQty) {
          it.bulkQty = qts.bulkQty;
          const bqInp = wsItemsTableBody.querySelector(`.item-bulk-qty-input[data-id="${id}"]`);
          if (bqInp) bqInp.value = it.bulkQty;
        }
        persistWholesalerItems();
      });
    });

    // Bind product name input change (for custom products or inline editing)
    wsItemsTableBody.querySelectorAll('.item-name-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (it) {
          it.name = e.target.value;
          persistWholesalerItems();
        }
      });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const id = e.target.getAttribute('data-id');
          const it = wholesalerItems.find(x => x.id === id);
          if (it) {
            it.isEditing = false;
            persistWholesalerItems();
            renderWholesalerItemsTable();
            showToast(`✓ Saved "${it.name || 'product'}"`);
          }
        }
      });
    });

    // Bind edit button & click-to-edit
    wsItemsTableBody.querySelectorAll('.btn-edit-item, .btn-trigger-edit').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.isEditing = true;
        renderWholesalerItemsTable();
        setTimeout(() => {
          const inp = wsItemsTableBody.querySelector(`.item-name-input[data-id="${id}"]`);
          if (inp) {
            inp.focus();
            inp.select();
          }
        }, 50);
      });
    });

    // Bind save / done button
    wsItemsTableBody.querySelectorAll('.btn-save-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (!it) return;
        it.isEditing = false;
        renderWholesalerItemsTable();
        showToast(`✓ Saved "${it.name || 'product'}"`);
      });
    });

    // Bind note input change
    wsItemsTableBody.querySelectorAll('.item-note-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const it = wholesalerItems.find(x => x.id === id);
        if (it) it.note = e.target.value.trim();
      });
    });

    // Bind remove button
    wsItemsTableBody.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const itemToRemove = wholesalerItems.find(x => x.id === id);
        const name = itemToRemove ? itemToRemove.name : 'this item';
        if (confirm(`Remove "${name}" from your wholesale quotation list?`)) {
          wholesalerItems = wholesalerItems.filter(x => x.id !== id);
          persistWholesalerItems();
          renderWholesalerItemsTable();
          showToast(`🗑️ Removed ${name}`);
        }
      });
    });
  }

  function renderQuickAddChips() {
    if (!quickAddChipsContainer) return;
    quickAddChipsContainer.innerHTML = '';

    quickAddCatalog.forEach(q => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-quick-chip';
      btn.innerHTML = `+ ${escapeHtml(q.name)}`;
      btn.addEventListener('click', () => {
        const existing = wholesalerItems.find(x => x.name.toLowerCase() === q.name.toLowerCase());
        if (existing) {
          const row = wsItemsTableBody?.querySelector(`tr[data-id="${existing.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.querySelector('.item-price-input')?.focus();
          }
          showToast(`Item "${q.name}" is already in your rate card`);
        } else {
          const qts = getDefaultQuantitiesForUnit(q.unit);
          wholesalerItems.push({
            id: 'ws-item-' + Date.now(),
            name: q.name,
            unit: q.unit,
            pricePerKg: q.defaultPriceKg || q.defaultPrice,
            price: q.defaultPrice,
            wholesaleQty: q.defaultWholesaleQty || qts.wsQty,
            bulkPrice: q.defaultBulkPrice || '',
            bulkQty: q.defaultBulkQty || qts.bulkQty,
            note: q.note
          });
          persistWholesalerItems();
          renderWholesalerItemsTable();
          showToast(`✨ Added "${q.name}" to rate card`);
          const newRow = wsItemsTableBody?.querySelector(`tr[data-id="${wholesalerItems[wholesalerItems.length - 1].id}"]`);
          newRow?.querySelector('.item-price-input')?.focus();
        }
      });
      quickAddChipsContainer.appendChild(btn);
    });
  }

  // Add Custom Product directly inline into the rate card table
  btnAddWsItem?.addEventListener('click', () => {
    const newItemId = 'ws-item-' + Date.now();
    const qts = getDefaultQuantitiesForUnit('Per kg');
    wholesalerItems.push({
      id: newItemId,
      name: '',
      unit: 'Per kg',
      pricePerKg: '',
      price: '',
      wholesaleQty: qts.wsQty,
      bulkPrice: '',
      bulkQty: qts.bulkQty,
      note: '',
      isCustom: true,
      isEditing: true
    });
    persistWholesalerItems();
    renderWholesalerItemsTable();
    setTimeout(() => {
      const row = wsItemsTableBody?.querySelector(`tr[data-id="${newItemId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInp = row.querySelector('.item-name-input');
        if (nameInp) nameInp.focus();
      }
    }, 60);
    showToast('➕ Added new product row to rate card');
  });

  // ==========================================
  // Render Wholesale Items in Communities Survey
  // ==========================================
  function renderCommunityWholesaleItems() {
    if (!communityWsContainer) return;

    const validItems = wholesalerItems.filter(it => it.name && it.name.trim().length > 0);

    if (communityWsLiveCount) {
      communityWsLiveCount.textContent = `${validItems.length} Mandi ${validItems.length === 1 ? 'Item' : 'Items'} Available`;
    }

    if (validItems.length === 0) {
      communityWsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #94a3b8; background: #ffffff; border-radius: 12px; border: 1.5px dashed #cbd5e1;">
          No wholesale mandi staples listed yet. Wholesalers can add custom products and mandi prices in the Wholesale Survey.
        </div>
      `;
      return;
    }

    communityWsContainer.innerHTML = '';

    validItems.forEach(item => {
      const isSelected = communitySelectedWholesaleItems.has(item.id);
      const selData = communitySelectedWholesaleItems.get(item.id) || {};
      const currentQty = selData.qty || 1;

      const card = document.createElement('div');
      card.className = `community-ws-card ${isSelected ? 'selected' : ''}`;
      card.setAttribute('data-id', item.id);

      const pKg = item.pricePerKg ? `<span class="community-ws-badge-kg">₹${item.pricePerKg}/kg</span>` : '';
      const wsQtySuffix = item.wholesaleQty ? `&nbsp;<span style="font-weight:600; font-size:0.75rem; opacity:0.85;">(Min: ${escapeHtml(item.wholesaleQty)})</span>` : '';
      const pBulk = item.price ? `<span class="community-ws-badge-wholesale">₹${item.price}${item.unit !== 'Per kg' ? ` / ${escapeHtml(item.unit)}` : ' / kg'}${wsQtySuffix}</span>` : '';
      const bulkQtySuffix = item.bulkQty ? `&nbsp;<span style="font-weight:600; font-size:0.75rem; opacity:0.85;">(Min: ${escapeHtml(item.bulkQty)})</span>` : '';
      const pBulkOrder = item.bulkPrice ? `<span class="community-ws-badge-bulk">📦 Bulk: ₹${item.bulkPrice}${item.unit !== 'Per kg' ? ` / ${escapeHtml(item.unit)}` : ' / kg'}${bulkQtySuffix}</span>` : '';

      card.innerHTML = `
        <div>
          <div class="community-ws-card-header">
            <div class="community-ws-title">${escapeHtml(item.name)}</div>
            <input type="checkbox" class="community-ws-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''} aria-label="Select ${escapeHtml(item.name)}">
          </div>
          <div class="community-ws-prices">
            ${pKg}
            ${pBulk}
            ${pBulkOrder}
          </div>
          ${item.note ? `<div class="community-ws-note">🛡️ ${escapeHtml(item.note)}</div>` : ''}
        </div>
        <div class="community-ws-card-footer">
          <span class="community-ws-unit">📦 Unit: ${escapeHtml(item.unit || 'Per kg')}</span>
          <div class="community-ws-qty-wrap" style="${isSelected ? 'display: inline-flex;' : 'display: none;'}">
            <label style="color: #475569; font-size: 0.75rem; font-weight: 600;">Qty:</label>
            <input type="number" min="1" max="99" value="${currentQty}" class="community-ws-qty-input" data-id="${item.id}" aria-label="Quantity for ${escapeHtml(item.name)}">
          </div>
        </div>
      `;

      // Click card to toggle selection
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('community-ws-qty-input')) return;

        const checkbox = card.querySelector('.community-ws-checkbox');
        const qtyWrap = card.querySelector('.community-ws-qty-wrap');
        const willSelect = (e.target === checkbox) ? checkbox.checked : !checkbox.checked;

        if (e.target !== checkbox) {
          checkbox.checked = willSelect;
        }

        if (checkbox.checked) {
          card.classList.add('selected');
          if (qtyWrap) qtyWrap.style.display = 'inline-flex';
          const qtyInp = card.querySelector('.community-ws-qty-input');
          const qtyVal = qtyInp ? parseInt(qtyInp.value, 10) || 1 : 1;
          communitySelectedWholesaleItems.set(item.id, {
            id: item.id,
            name: item.name,
            unit: item.unit,
            pricePerKg: item.pricePerKg,
            price: item.price,
            wholesaleQty: item.wholesaleQty,
            bulkPrice: item.bulkPrice,
            bulkQty: item.bulkQty,
            note: item.note,
            qty: qtyVal
          });
        } else {
          card.classList.remove('selected');
          if (qtyWrap) qtyWrap.style.display = 'none';
          communitySelectedWholesaleItems.delete(item.id);
        }

        syncCommunityItemsToChips();
        updateProgress();
      });

      // Quantity input change
      const qtyInp = card.querySelector('.community-ws-qty-input');
      qtyInp?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 1;
        if (communitySelectedWholesaleItems.has(item.id)) {
          const prev = communitySelectedWholesaleItems.get(item.id);
          communitySelectedWholesaleItems.set(item.id, { ...prev, qty: val });
        }
      });

      communityWsContainer.appendChild(card);
    });

    syncWholesaleItemsToChips();
  }

  function syncWholesaleItemsToChips() {
    if (!itemsChipsContainer) return;
    const validItems = wholesalerItems.filter(it => it.name && it.name.trim().length > 0);

    validItems.forEach(it => {
      const cleanName = it.name.replace(/^[\p{Emoji}\s]+/u, '').trim();
      const existing = itemsChipsContainer.querySelector(`input[name="itemsBought"][data-ws-id="${it.id}"]`);
      if (!existing) {
        const hasText = Array.from(itemsChipsContainer.querySelectorAll('span')).some(s => s.textContent.toLowerCase().includes(cleanName.toLowerCase()));
        if (!hasText) {
          const label = document.createElement('label');
          label.className = 'chip-item chip-ws-synced';
          label.innerHTML = `
            <input type="checkbox" name="itemsBought" value="${escapeHtml(it.name)}" data-ws-id="${it.id}">
            <span>${escapeHtml(it.name)}</span>
          `;
          label.querySelector('input')?.addEventListener('change', updateProgress);
          itemsChipsContainer.appendChild(label);
        }
      }
    });
  }

  function syncCommunityItemsToChips() {
    communitySelectedWholesaleItems.forEach((val, id) => {
      const chipInp = itemsChipsContainer?.querySelector(`input[name="itemsBought"][data-ws-id="${id}"]`);
      if (chipInp) chipInp.checked = true;
    });
  }

  // Initial render of wholesaler rate card & community showcase
  renderWholesalerItemsTable();
  renderQuickAddChips();
  renderCommunityWholesaleItems();

  // ==========================================
  // Wholesalers Form Submission Logic
  // ==========================================
  function getWholesalerData() {
    const getRadio = (name) => {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : '';
    };

    const getCheckboxes = (name) => {
      return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
    };

    // Filter out items that have no name
    const validItems = wholesalerItems.filter(it => it.name && it.name.trim().length > 0);

    // Build structured varieties list with 1 kg, wholesale (with min qty), and bulk order prices (with min qty)
    const productVarieties = validItems.map(it => {
      const pKg = it.pricePerKg ? `₹${it.pricePerKg}/kg` : '';
      const pWholesale = it.price ? `₹${it.price}/${it.unit}${it.wholesaleQty ? ` (Min: ${it.wholesaleQty})` : ''}` : '';
      const pBulk = it.bulkPrice ? `Bulk: ₹${it.bulkPrice}${it.bulkQty ? ` (Min: ${it.bulkQty})` : ''}` : '';
      const priceStr = [pKg, pWholesale, pBulk].filter(Boolean).join(' | ');
      return `${it.name} (${priceStr || it.unit})${it.note ? ` - ${it.note}` : ''}`;
    });

    return {
      submittedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      firmName: document.getElementById('ws-in-firm-name')?.value.trim() || '',
      personName: document.getElementById('ws-in-person-name')?.value.trim() || '',
      contactPhone: document.getElementById('ws-in-contact-phone')?.value.trim() || '',
      location: document.getElementById('ws-in-location')?.value.trim() || '',
      gstStatus: getRadio('ws_in_gst_status'),
      gstin: document.getElementById('ws-in-gstin')?.value.trim().toUpperCase() || '',
      fssaiStatus: getRadio('ws_in_fssai_status'),
      fssaiNumber: document.getElementById('ws-in-fssai-num')?.value.trim() || '',
      fssaiValidity: document.getElementById('ws-in-fssai-validity')?.value.trim() || '',
      mfgExpiryDetails: getRadio('ws_in_mfg_expiry'),
      shelfLifeGuarantee: document.getElementById('ws-in-shelf-life')?.value || '',
      batchAndSealedCondition: document.getElementById('ws-in-batch-sealed')?.value || '',
      replacementPolicy: getRadio('ws_in_replacement_policy'),
      inspectionAllowed: document.getElementById('ws-in-inspection-allowed')?.checked ? 'Yes (100% Inspection Allowed)' : 'No',
      items: validItems,
      productVarieties,
      qualityGrade: document.getElementById('ws-in-quality-grade')?.value || '',
      moistureContent: document.getElementById('ws-in-moisture-level')?.value || '',
      sampleKitAvailability: getRadio('ws_in_samples'),
      paymentTiming: getRadio('ws_in_payment_timing'),
      paymentModes: getCheckboxes('ws_in_payment_modes'),
      creditFacility: getRadio('ws_in_credit_facility'),
      writtenQuotation: getRadio('ws_in_written_quotation'),
      writtenReturnTerms: getRadio('ws_in_written_returns'),
      moq: document.getElementById('ws-in-moq')?.value.trim() || '',
      deliveryCoverage: document.getElementById('ws-in-delivery-radius')?.value.trim() || '',
      notes: document.getElementById('ws-in-notes')?.value.trim() || ''
    };
  }

  function generateWholesalerWhatsAppMessage(d) {
    const itemsListText = (d.items && d.items.length > 0)
      ? d.items.map(it => {
          const pKg = it.pricePerKg ? `₹${it.pricePerKg}/kg` : '';
          const pWholesale = it.price ? `₹${it.price}/${it.unit}${it.wholesaleQty ? ` [Min: ${it.wholesaleQty}]` : ''}` : '';
          const pBulk = it.bulkPrice ? `Bulk: ₹${it.bulkPrice}${it.bulkQty ? ` [Min: ${it.bulkQty}]` : ''}` : '';
          const pStr = [pKg, pWholesale, pBulk].filter(Boolean).join(' | ');
          return `   • *${it.name}* (${it.unit}): ${pStr || 'Unpriced'}${it.note ? ` [${it.note}]` : ''}`;
        }).join('\n')
      : ((d.productVarieties && d.productVarieties.length > 0)
          ? d.productVarieties.map(v => `   • ${v}`).join('\n')
          : '   • Bulk Mandi Staples');

    return (
      `*MANA COMMUNITY - WHOLESALE VENDOR QUOTATION & TERMS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏢 *Firm:* ${d.firmName || 'Not Specified'}\n` +
      `👤 *Contact:* ${d.personName || 'Proprietor'} (📞 ${d.contactPhone || 'N/A'})\n` +
      `📍 *Godown/Location:* ${d.location || 'N/A'}\n\n` +
      `1️⃣ *GST Invoice / Bill:* ${d.gstStatus}${d.gstin ? `\n   ↳ GSTIN: ${d.gstin}` : ''}\n` +
      `2️⃣ *FSSAI Food Safety:* ${d.fssaiStatus}${d.fssaiNumber ? `\n   ↳ Reg No: ${d.fssaiNumber} (${d.fssaiValidity || 'Active'})` : ''}\n` +
      `3️⃣ *Mfg & Expiry:* ${d.mfgExpiryDetails}\n   ↳ Shelf Life: ${d.shelfLifeGuarantee}\n` +
      `4️⃣ *Batch & Packaging:* ${d.batchAndSealedCondition}\n` +
      `5️⃣ *Replacement Policy:* ${d.replacementPolicy}\n   ↳ Inspection: ${d.inspectionAllowed}\n` +
      `6️⃣ *Itemized Rate Card / Wholesale Prices:*\n` +
      `${itemsListText}\n` +
      `   • Grade: ${d.qualityGrade}\n` +
      `   • Moisture: ${d.moistureContent}\n` +
      `   • Samples: ${d.sampleKitAvailability}\n` +
      `7️⃣ *Payment & Business Terms:*\n` +
      `   • Payment Timing: ${d.paymentTiming}\n` +
      `   • Accepted Modes: ${(d.paymentModes || []).join(', ')}\n` +
      `   • Credit Facility: ${d.creditFacility}\n` +
      `   • Written Quotation: ${d.writtenQuotation}\n` +
      `   • Written Return Terms: ${d.writtenReturnTerms}\n` +
      (d.moq ? `📦 *MOQ:* ${d.moq}\n` : '') +
      (d.deliveryCoverage ? `🚚 *Delivery:* ${d.deliveryCoverage}\n` : '') +
      (d.notes ? `📝 *Notes/Prices:* ${d.notes}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `_Generated via Mana Community Hyperlocal Procurement Platform_`
    );
  }

  btnSubmitWholesaler?.addEventListener('click', async () => {
    const firm = document.getElementById('ws-in-firm-name')?.value.trim();
    const person = document.getElementById('ws-in-person-name')?.value.trim();
    const phone = document.getElementById('ws-in-contact-phone')?.value.trim();
    const location = document.getElementById('ws-in-location')?.value.trim();

    if (!firm || !person || !phone || !location) {
      alert('Please fill in all mandatory profile fields: Firm Name, Contact Person, Phone, and Godown Location.');
      return;
    }

    if (wholesalerItems.length === 0) {
      alert('Please add at least one product with price in your rate card before submitting.');
      return;
    }

    const data = getWholesalerData();
    btnSubmitWholesaler.disabled = true;
    btnSubmitWholesaler.textContent = 'Saving...';

    try {
      await FirebaseService.submitWholesalerQuotation(data);
      alert('🎉 Wholesaler quotation recorded successfully! You can also click "Share on WhatsApp" to forward it directly to the community procurement team.');
    } catch (e) {
      console.warn('Wholesaler quotation save error:', e);
    } finally {
      btnSubmitWholesaler.disabled = false;
      btnSubmitWholesaler.textContent = 'Submit Wholesaler Quotation';
    }
  });

  btnWaWholesaler?.addEventListener('click', () => {
    const data = getWholesalerData();
    const message = generateWholesalerWhatsAppMessage(data);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  });

  btnPrintWholesaler?.addEventListener('click', () => {
    window.print();
  });

  // URL Hash detection for direct wholesaler linking
  if (window.location.hash === '#wholesalers' || window.location.search.includes('tab=wholesalers')) {
    switchPortalTab('wholesalers');
  }

  updateProgress();
  updateBadge();
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
