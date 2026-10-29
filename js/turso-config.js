/**
 * Mana Community Survey - Turso libSQL Database Service
 * Organization: https://app.turso.tech/kondareddy
 * Built on libSQL HTTP Pipeline API v2 for serverless browser execution.
 */

const TURSO_STORAGE_KEYS = {
  CONFIG: 'mana_turso_db_config_v1',
  RESIDENTS_LOCAL: 'mana_community_survey_responses_v1',
  WHOLESALERS_LOCAL: 'mana_community_wholesaler_responses_v1'
};

const TursoService = (function() {
  // Default organization database configuration
  let config = {
    url: 'https://manamart-kondareddy.aws-ap-south-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMwMTk2MjcsImlkIjoiMDFhMTc4NDEtNDIwMS03YmMxLTg5ZjQtZjVlYjRlYjQ4NjJiIiwia2lkIjoiZ1d3bW1FN2pWcGEzRzE1ZVJnQ1hiZjdhV0YxNENOS2h0TU1rMkczRjJERSIsInJpZCI6ImU5MjhkYTI0LTIyYTUtNGFjYy1hOWY3LTUzM2I2ZDRlOWM2NyJ9.HBq0LuM4O8X4MOx-Bx45FfXp1njz7JJOM3qPNi8ZBwG5qW3fBTY62BDUy3L5BY2w5fazO0rdGEg9h0HdS3fuBQ'
  };

  let isConnected = false;
  let pollInterval = null;

  // Load saved config from localStorage
  function loadConfig() {
    try {
      const saved = localStorage.getItem(TURSO_STORAGE_KEYS.CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.authToken) {
          config = { ...config, ...parsed };
        } else {
          config.url = parsed.url || config.url;
        }
      }
    } catch (e) {
      console.warn('Could not load Turso config from storage:', e);
    }
    normalizeConfig();
  }

  function normalizeConfig() {
    if (config.url) {
      config.url = config.url.trim().replace(/^libsql:\/\//i, 'https://').replace(/\/$/, '');
      if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        config.url = 'https://' + config.url;
      }
    }
    if (config.authToken) {
      config.authToken = config.authToken.trim().replace(/^Bearer\s+/i, '');
    }
  }

  // Save config
  function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    normalizeConfig();
    localStorage.setItem(TURSO_STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }

  function getLocal(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal(key, items) {
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch (e) {}
  }

  // Low-level HTTP Pipeline execution
  async function execute(sql, args = []) {
    if (!config.url || !config.authToken) {
      throw new Error('Turso Database URL and Auth Token are required. Configure them in the Turso Settings.');
    }

    const endpoint = config.url + '/v2/pipeline';

    const formattedArgs = args.map(arg => {
      if (arg === null || arg === undefined) {
        return { type: 'null' };
      }
      if (typeof arg === 'number') {
        return Number.isInteger(arg) 
          ? { type: 'integer', value: String(arg) }
          : { type: 'float', value: arg };
      }
      if (typeof arg === 'boolean') {
        return { type: 'integer', value: arg ? '1' : '0' };
      }
      if (typeof arg === 'object') {
        return { type: 'text', value: JSON.stringify(arg) };
      }
      return { type: 'text', value: String(arg) };
    });

    const payload = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: formattedArgs
          }
        },
        { type: 'close' }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Turso HTTP Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const firstResult = data.results && data.results[0];

    if (firstResult && firstResult.type === 'error') {
      throw new Error(`Turso SQL Error: ${firstResult.error.message}`);
    }

    const queryResult = firstResult?.response?.result;
    return parseRows(queryResult);
  }

  function parseRows(resultObj) {
    if (!resultObj || !resultObj.cols || !resultObj.rows) return [];
    const colNames = resultObj.cols.map(c => c.name);

    return resultObj.rows.map(row => {
      const obj = {};
      colNames.forEach((name, idx) => {
        const val = row[idx];
        if (!val || val.type === 'null') {
          obj[name] = null;
        } else if (val.type === 'integer') {
          obj[name] = Number(val.value);
        } else if (val.type === 'float') {
          obj[name] = val.value;
        } else {
          obj[name] = val.value;
        }
      });
      return obj;
    });
  }

  // Auto initialize tables in Turso database
  async function initTables() {
    // 1. Table for resident surveys
    const sqlResidents = `
      CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        submitted_at TEXT,
        apartment_name TEXT,
        flat_number TEXT,
        person_name TEXT,
        contact_number TEXT,
        willingness TEXT,
        where_buy TEXT,
        items_bought TEXT,
        other_items TEXT,
        monthly_spending TEXT,
        purchase_frequency TEXT,
        service_products TEXT,
        problems_faced TEXT,
        other_problems TEXT,
        delivery_method TEXT,
        try_monthly_service TEXT,
        other_suggestions TEXT,
        created_at_iso TEXT
      );
    `;

    // 2. Table for wholesaler quotations
    const sqlWholesalers = `
      CREATE TABLE IF NOT EXISTS wholesaler_quotations (
        id TEXT PRIMARY KEY,
        submitted_at TEXT,
        firm_name TEXT,
        person_name TEXT,
        contact_phone TEXT,
        location TEXT,
        gst_status TEXT,
        gstin TEXT,
        fssai_status TEXT,
        fssai_number TEXT,
        fssai_validity TEXT,
        mfg_expiry_details TEXT,
        shelf_life_guarantee TEXT,
        batch_sealed_condition TEXT,
        replacement_policy TEXT,
        inspection_allowed TEXT,
        items_json TEXT,
        product_varieties TEXT,
        quality_grade TEXT,
        moisture_content TEXT,
        sample_kit_availability TEXT,
        payment_timing TEXT,
        payment_modes TEXT,
        credit_facility TEXT,
        written_quotation TEXT,
        written_return_terms TEXT,
        moq TEXT,
        delivery_coverage TEXT,
        notes TEXT,
        created_at_iso TEXT
      );
    `;

    await execute(sqlResidents);
    await execute(sqlWholesalers);
    console.log('✅ Turso database tables verified and initialized successfully.');
  }

  // Test connection to Turso database
  async function testConnection() {
    try {
      await execute('SELECT 1 as ping;');
      await initTables();
      isConnected = true;
      return { success: true };
    } catch (err) {
      isConnected = false;
      return { success: false, error: err.message };
    }
  }

  function safeJsonParse(str, fallback = []) {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  // Submit resident survey
  async function submitResidentSurvey(data) {
    const item = {
      id: 'res-' + Date.now(),
      createdAtIso: new Date().toISOString(),
      ...data
    };

    // Save locally immediately
    const localList = getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
    localList.unshift(item);
    saveLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL, localList);

    // Sync to Turso database if credentials available
    if (config.url && config.authToken) {
      try {
        const sql = `
          INSERT INTO survey_responses (
            id, submitted_at, apartment_name, flat_number, person_name, contact_number,
            willingness, where_buy, items_bought, other_items, monthly_spending,
            purchase_frequency, service_products, problems_faced, other_problems,
            delivery_method, try_monthly_service, other_suggestions, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const args = [
          item.id,
          item.submittedAt || '',
          item.apartmentName || '',
          item.flatNumber || '',
          item.personName || '',
          item.contactNumber || '',
          item.willingness || '',
          item.whereBuy || [],
          item.itemsBought || [],
          item.otherItems || '',
          item.monthlySpending || '',
          item.purchaseFrequency || '',
          item.serviceProducts || [],
          item.problemsFaced || [],
          item.otherProblems || '',
          item.deliveryMethod || '',
          item.tryMonthlyService || '',
          item.otherSuggestions || '',
          item.createdAtIso
        ];

        await execute(sql, args);
        isConnected = true;
      } catch (err) {
        console.warn('Turso resident survey insert note:', err.message);
      }
    }

    return item;
  }

  // Submit wholesaler quotation
  async function submitWholesalerQuotation(data) {
    const item = {
      id: 'ws-' + Date.now(),
      createdAtIso: new Date().toISOString(),
      ...data
    };

    const localList = getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
    localList.unshift(item);
    saveLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL, localList);

    if (config.url && config.authToken) {
      try {
        const sql = `
          INSERT INTO wholesaler_quotations (
            id, submitted_at, firm_name, person_name, contact_phone, location,
            gst_status, gstin, fssai_status, fssai_number, fssai_validity,
            mfg_expiry_details, shelf_life_guarantee, batch_sealed_condition,
            replacement_policy, inspection_allowed, items_json, product_varieties,
            quality_grade, moisture_content, sample_kit_availability, payment_timing,
            payment_modes, credit_facility, written_quotation, written_return_terms,
            moq, delivery_coverage, notes, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const args = [
          item.id,
          item.submittedAt || '',
          item.firmName || '',
          item.personName || '',
          item.contactPhone || '',
          item.location || '',
          item.gstStatus || '',
          item.gstin || '',
          item.fssaiStatus || '',
          item.fssaiNumber || '',
          item.fssaiValidity || '',
          item.mfgExpiryDetails || '',
          item.shelfLifeGuarantee || '',
          item.batchAndSealedCondition || '',
          item.replacementPolicy || '',
          item.inspectionAllowed || '',
          item.items || [],
          item.productVarieties || [],
          item.qualityGrade || '',
          item.moistureContent || '',
          item.sampleKitAvailability || '',
          item.paymentTiming || '',
          item.paymentModes || [],
          item.creditFacility || '',
          item.writtenQuotation || '',
          item.writtenReturnTerms || '',
          item.moq || '',
          item.deliveryCoverage || '',
          item.notes || '',
          item.createdAtIso
        ];

        await execute(sql, args);
        isConnected = true;
      } catch (err) {
        console.warn('Turso wholesaler quotation insert note:', err.message);
      }
    }

    return item;
  }

  // Fetch all residents from Turso
  async function fetchResidents() {
    if (!config.url || !config.authToken) {
      return getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
    }

    try {
      const rows = await execute('SELECT * FROM survey_responses ORDER BY created_at_iso DESC;');
      const list = rows.map(r => ({
        id: r.id,
        submittedAt: r.submitted_at,
        apartmentName: r.apartment_name,
        flatNumber: r.flat_number || '',
        personName: r.person_name,
        contactNumber: r.contact_number || '',
        willingness: r.willingness || '',
        whereBuy: safeJsonParse(r.where_buy, []),
        itemsBought: safeJsonParse(r.items_bought, []),
        otherItems: r.other_items || '',
        monthlySpending: r.monthly_spending || '',
        purchaseFrequency: r.purchase_frequency || '',
        serviceProducts: safeJsonParse(r.service_products, []),
        problemsFaced: safeJsonParse(r.problems_faced, []),
        otherProblems: r.other_problems || '',
        deliveryMethod: r.delivery_method || '',
        tryMonthlyService: r.try_monthly_service || '',
        otherSuggestions: r.other_suggestions || '',
        createdAtIso: r.created_at_iso
      }));

      // Merge with pending local items
      const local = getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
      const localOnly = local.filter(loc => !list.some(t => t.id === loc.id));
      const combined = [...list, ...localOnly];

      saveLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL, combined);
      isConnected = true;
      return combined;
    } catch (e) {
      console.warn('Turso fetchResidents warning:', e.message);
      return getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
    }
  }

  // Fetch all wholesalers from Turso
  async function fetchWholesalers() {
    if (!config.url || !config.authToken) {
      return getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
    }

    try {
      const rows = await execute('SELECT * FROM wholesaler_quotations ORDER BY created_at_iso DESC;');
      const list = rows.map(w => ({
        id: w.id,
        submittedAt: w.submitted_at,
        firmName: w.firm_name,
        personName: w.person_name,
        contactPhone: w.contact_phone,
        location: w.location,
        gstStatus: w.gst_status,
        gstin: w.gstin || '',
        fssaiStatus: w.fssai_status,
        fssaiNumber: w.fssai_number || '',
        fssaiValidity: w.fssai_validity || '',
        mfgExpiryDetails: w.mfg_expiry_details,
        shelfLifeGuarantee: w.shelf_life_guarantee,
        batchAndSealedCondition: w.batch_sealed_condition,
        replacementPolicy: w.replacement_policy,
        inspectionAllowed: w.inspection_allowed,
        items: safeJsonParse(w.items_json, []),
        productVarieties: safeJsonParse(w.product_varieties, []),
        qualityGrade: w.quality_grade,
        moistureContent: w.moisture_content,
        sampleKitAvailability: w.sample_kit_availability,
        paymentTiming: w.payment_timing,
        paymentModes: safeJsonParse(w.payment_modes, []),
        creditFacility: w.credit_facility,
        writtenQuotation: w.written_quotation,
        writtenReturnTerms: w.written_return_terms,
        moq: w.moq || '',
        deliveryCoverage: w.delivery_coverage || '',
        notes: w.notes || '',
        createdAtIso: w.created_at_iso
      }));

      const local = getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
      const localOnly = local.filter(loc => !list.some(t => t.id === loc.id));
      const combined = [...list, ...localOnly];

      saveLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL, combined);
      isConnected = true;
      return combined;
    } catch (e) {
      console.warn('Turso fetchWholesalers warning:', e.message);
      return getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
    }
  }

  // Delete resident
  async function deleteResident(id) {
    const list = getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
    const updated = list.filter(r => r.id !== id);
    saveLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL, updated);

    if (config.url && config.authToken) {
      try {
        await execute('DELETE FROM survey_responses WHERE id = ?;', [id]);
      } catch (e) {
        console.warn('Turso delete resident warning:', e.message);
      }
    }
    return updated;
  }

  // Delete wholesaler
  async function deleteWholesaler(id) {
    const list = getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
    const updated = list.filter(w => w.id !== id);
    saveLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL, updated);

    if (config.url && config.authToken) {
      try {
        await execute('DELETE FROM wholesaler_quotations WHERE id = ?;', [id]);
      } catch (e) {
        console.warn('Turso delete wholesaler warning:', e.message);
      }
    }
    return updated;
  }

  // Sync local offline records to Turso
  async function syncLocalToTurso() {
    if (!config.url || !config.authToken) return { count: 0 };
    await initTables();

    const residents = getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL);
    let synced = 0;

    for (const r of residents) {
      try {
        await execute(
          `INSERT OR IGNORE INTO survey_responses (
            id, submitted_at, apartment_name, flat_number, person_name, contact_number,
            willingness, where_buy, items_bought, other_items, monthly_spending,
            purchase_frequency, service_products, problems_faced, other_problems,
            delivery_method, try_monthly_service, other_suggestions, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            r.id, r.submittedAt || '', r.apartmentName || '', r.flatNumber || '',
            r.personName || '', r.contactNumber || '', r.willingness || '',
            r.whereBuy || [], r.itemsBought || [], r.otherItems || '',
            r.monthlySpending || '', r.purchaseFrequency || '', r.serviceProducts || [],
            r.problemsFaced || [], r.otherProblems || '', r.deliveryMethod || '',
            r.tryMonthlyService || '', r.otherSuggestions || '', r.createdAtIso || new Date().toISOString()
          ]
        );
        synced++;
      } catch (e) {}
    }

    const wholesalers = getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL);
    for (const w of wholesalers) {
      try {
        await execute(
          `INSERT OR IGNORE INTO wholesaler_quotations (
            id, submitted_at, firm_name, person_name, contact_phone, location,
            gst_status, gstin, fssai_status, fssai_number, fssai_validity,
            mfg_expiry_details, shelf_life_guarantee, batch_sealed_condition,
            replacement_policy, inspection_allowed, items_json, product_varieties,
            quality_grade, moisture_content, sample_kit_availability, payment_timing,
            payment_modes, credit_facility, written_quotation, written_return_terms,
            moq, delivery_coverage, notes, created_at_iso
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            w.id, w.submittedAt || '', w.firmName || '', w.personName || '',
            w.contactPhone || '', w.location || '', w.gstStatus || '', w.gstin || '',
            w.fssaiStatus || '', w.fssaiNumber || '', w.fssaiValidity || '',
            w.mfgExpiryDetails || '', w.shelfLifeGuarantee || '', w.batchAndSealedCondition || '',
            w.replacementPolicy || '', w.inspectionAllowed || '', w.items || [],
            w.productVarieties || [], w.qualityGrade || '', w.moistureContent || '',
            w.sampleKitAvailability || '', w.paymentTiming || '', w.paymentModes || [],
            w.creditFacility || '', w.writtenQuotation || '', w.writtenReturnTerms || '',
            w.moq || '', w.deliveryCoverage || '', w.notes || '', w.createdAtIso || new Date().toISOString()
          ]
        );
        synced++;
      } catch (e) {}
    }

    return { count: synced };
  }

  // Periodic subscription poll
  function subscribeResidents(onData) {
    onData(getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL));
    fetchResidents().then(list => onData(list));

    const interval = setInterval(async () => {
      if (config.url && config.authToken) {
        const list = await fetchResidents();
        onData(list);
      }
    }, 15000);

    return () => clearInterval(interval);
  }

  function subscribeWholesalers(onData) {
    onData(getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL));
    fetchWholesalers().then(list => onData(list));

    const interval = setInterval(async () => {
      if (config.url && config.authToken) {
        const list = await fetchWholesalers();
        onData(list);
      }
    }, 15000);

    return () => clearInterval(interval);
  }

  // Initialize on load
  loadConfig();

  return {
    getConfig: () => ({ ...config }),
    saveConfig,
    isConnected: () => isConnected,
    testConnection,
    initTables,
    execute,
    syncLocalToTurso,
    getLocalResidents: () => getLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL),
    getLocalWholesalers: () => getLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL),
    saveLocalResidents: (items) => saveLocal(TURSO_STORAGE_KEYS.RESIDENTS_LOCAL, items),
    saveLocalWholesalers: (items) => saveLocal(TURSO_STORAGE_KEYS.WHOLESALERS_LOCAL, items),
    submitResidentSurvey,
    submitWholesalerQuotation,
    fetchResidents,
    fetchWholesalers,
    deleteResident,
    deleteWholesaler,
    subscribeResidents,
    subscribeWholesalers
  };
})();

// Bridge: ensure DatabaseService is accessible globally
window.TursoService = TursoService;
window.DatabaseService = TursoService;
