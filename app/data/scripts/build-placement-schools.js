#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

/**
 * Columns expected in source CSVs.
 * @type {string[]}
 */
const EXPECTED_FIELDS = [
  "id",
  "start_academic_year",
  "provider_name",
  "provider_code",
  "provider_ukprn",
  "partner_name",
  "partner_reference",
  "partner_type",
  "school_name",
  "school_urn",
  "subject_name",
];

/**
 * Columns emitted in seed-placement-schools.csv (ordered).
 * @type {string[]}
 */
const OUTPUT_FIELDS = [
  "providerId",
  "partnerId",
  "schoolId",
  "academicYearId",
  "subjectId",
];

/**
 * Parse a CSV string into rows of fields.
 * @param {string} content
 * @returns {string[][]}
 */
function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // Ignore CR in CRLF.
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Escape a value for CSV output.
 * @param {string} value
 * @returns {string}
 */
function toCsvValue(value) {
  const text = value ?? "";
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Convert rows into a CSV string.
 * @param {string[][]} rows
 * @returns {string}
 */
function writeCsv(rows) {
  return rows.map((row) => row.map(toCsvValue).join(",")).join("\n") + "\n";
}

/**
 * Format a timestamp for filenames (YYYYMMDDHHmmss).
 * @param {Date} date
 * @returns {string}
 */
function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

/**
 * Ensure dist directory exists and resolve output path.
 * @param {string} distDir
 * @param {string} baseName
 * @returns {string}
 */
function resolveOutputPath(distDir, baseName) {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outputPath = path.join(distDir, baseName);
  if (!fs.existsSync(outputPath)) {
    return outputPath;
  }

  const ext = path.extname(baseName);
  const stem = path.basename(baseName, ext);
  const timestamp = formatTimestamp(new Date());
  let candidate = path.join(distDir, `${stem}-${timestamp}${ext}`);
  let counter = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(distDir, `${stem}-${timestamp}-${counter}${ext}`);
    counter += 1;
  }

  return candidate;
}

/**
 * Build a unique missing-items filename based on output csv path.
 * @param {string} csvPath
 * @returns {string}
 */
function resolveMissingOutputPath(csvPath) {
  const dir = path.dirname(csvPath);
  const ext = path.extname(csvPath);
  const stem = path.basename(csvPath, ext);
  const baseName = `${stem}-missing.csv`;
  return resolveOutputPath(dir, baseName);
}

/**
 * Extract year from a placement-schools-YYYY-raw.csv filename.
 * @param {string} filename
 * @returns {string|null}
 */
function yearFromFilename(filename) {
  const match = filename.match(/placement-schools-(\d{4})-raw\.csv$/);
  return match ? match[1] : null;
}

/**
 * Normalize a lookup key value.
 * @param {string} value
 * @returns {string}
 */
function normalizeKey(value) {
  return (value ?? "").trim();
}

/**
 * Normalize a subject name for matching.
 * @param {string} value
 * @returns {string}
 */
function normalizeSubject(value) {
  return normalizeKey(value).toLowerCase().replace(/\s+/g, " ");
}

/**
 * Read CSV file and return rows.
 * @param {string} filePath
 * @returns {string[][]}
 */
function readCsvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing CSV file: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, "utf8");
  return parseCsv(content);
}

/**
 * Load provider lookup maps from seed-providers.csv.
 * @param {string} filePath
 * @returns {{ byCode: Map<string, string>, byUkprn: Map<string, string>, byUrn: Map<string, string> }}
 */
function loadProviders(filePath) {
  const rows = readCsvFile(filePath);
  const header = rows.shift();
  if (!header) {
    throw new Error(`Empty providers CSV: ${filePath}`);
  }

  const idIndex = header.indexOf("id");
  const codeIndex = header.indexOf("providerCode");
  const ukprnIndex = header.indexOf("ukprn");
  const urnIndex = header.indexOf("urn");

  if (idIndex === -1 || codeIndex === -1 || ukprnIndex === -1 || urnIndex === -1) {
    throw new Error(`Unexpected providers columns in ${filePath}`);
  }

  const byCode = new Map();
  const byUkprn = new Map();
  const byUrn = new Map();

  for (const values of rows) {
    const id = normalizeKey(values[idIndex]);
    if (!id) continue;

    const providerCode = normalizeKey(values[codeIndex]);
    const ukprn = normalizeKey(values[ukprnIndex]);
    const urn = normalizeKey(values[urnIndex]);

    if (providerCode && !byCode.has(providerCode)) {
      byCode.set(providerCode, id);
    }
    if (ukprn && !byUkprn.has(ukprn)) {
      byUkprn.set(ukprn, id);
    }
    if (urn && !byUrn.has(urn)) {
      byUrn.set(urn, id);
    }
  }

  return { byCode, byUkprn, byUrn };
}

/**
 * Load school lookup map from seed-schools.csv.
 * @param {string} filePath
 * @returns {Map<string, string>}
 */
function loadSchools(filePath) {
  const rows = readCsvFile(filePath);
  const header = rows.shift();
  if (!header) {
    throw new Error(`Empty schools CSV: ${filePath}`);
  }

  const idIndex = header.indexOf("id");
  const urnIndex = header.indexOf("urn");

  if (idIndex === -1 || urnIndex === -1) {
    throw new Error(`Unexpected schools columns in ${filePath}`);
  }

  const byUrn = new Map();
  for (const values of rows) {
    const id = normalizeKey(values[idIndex]);
    const urn = normalizeKey(values[urnIndex]);
    if (id && urn && !byUrn.has(urn)) {
      byUrn.set(urn, id);
    }
  }

  return byUrn;
}

/**
 * Load academic year lookup map from seed-academic-years.json.
 * @param {string} filePath
 * @returns {Map<string, string>}
 */
function loadAcademicYears(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing academic years file: ${filePath}`);
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const map = new Map();
  for (const entry of data) {
    if (entry && entry.code && entry.id) {
      map.set(String(entry.code), entry.id);
    }
  }
  return map;
}

/**
 * Load subject lookup map from seed-subjects.json.
 * @param {string} filePath
 * @returns {Map<string, string>}
 */
function loadSubjects(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing subjects file: ${filePath}`);
  }
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const map = new Map();
  for (const entry of data) {
    if (entry && entry.code && entry.id) {
      map.set(normalizeSubject(entry.code), entry.id);
    }
  }
  return map;
}

/**
 * Resolve a provider id using provider code or UKPRN.
 * @param {{ byCode: Map<string, string>, byUkprn: Map<string, string> }} lookup
 * @param {string} providerCode
 * @param {string} providerUkprn
 * @returns {string}
 */
function resolveProviderId(lookup, providerCode, providerUkprn) {
  const code = normalizeKey(providerCode);
  if (code && lookup.byCode.has(code)) {
    return lookup.byCode.get(code) || "";
  }

  const ukprn = normalizeKey(providerUkprn);
  if (ukprn && lookup.byUkprn.has(ukprn)) {
    return lookup.byUkprn.get(ukprn) || "";
  }

  return "";
}

/**
 * Resolve a partner id using reference (provider code, UKPRN, or URN).
 * @param {{ byCode: Map<string, string>, byUkprn: Map<string, string>, byUrn: Map<string, string> }} lookup
 * @param {string} partnerReference
 * @returns {string}
 */
function resolvePartnerId(lookup, partnerReference) {
  const reference = normalizeKey(partnerReference);
  if (!reference) return "";

  if (lookup.byCode.has(reference)) {
    return lookup.byCode.get(reference) || "";
  }
  if (lookup.byUkprn.has(reference)) {
    return lookup.byUkprn.get(reference) || "";
  }
  if (lookup.byUrn.has(reference)) {
    return lookup.byUrn.get(reference) || "";
  }

  return "";
}

/**
 * Build app/data/dist/seed-placement-schools.csv from source files.
 * @returns {void}
 */
function main() {
  const dataDir = path.resolve(__dirname, "..");
  const srcDir = path.join(dataDir, "src");
  const distDir = path.join(dataDir, "dist");

  const seedDir = path.resolve(dataDir, "..", "seeders", "data");
  const providersPath = path.join(seedDir, "seed-providers.csv");
  const schoolsPath = path.join(seedDir, "seed-schools.csv");
  const academicYearsPath = path.join(seedDir, "seed-academic-years.json");
  const subjectsPath = path.join(seedDir, "seed-subjects.json");

  const providers = loadProviders(providersPath);
  const schoolsByUrn = loadSchools(schoolsPath);
  const academicYearsByCode = loadAcademicYears(academicYearsPath);
  const subjectsByCode = loadSubjects(subjectsPath);

  const files = fs
    .readdirSync(srcDir)
    .map((name) => ({
      name,
      year: yearFromFilename(name),
    }))
    .filter((item) => item.year)
    .sort((a, b) => Number(a.year) - Number(b.year))
    .map((item) => ({
      year: item.year,
      fullPath: path.join(srcDir, item.name),
    }));

  if (files.length === 0) {
    throw new Error(`No input files found in ${srcDir}`);
  }

  const outputRows = [OUTPUT_FIELDS];

  const missingProviders = new Set();
  const missingPartners = new Set();
  const missingSchools = new Set();
  const missingYears = new Set();
  const missingSubjects = new Set();

  let totalRows = 0;
  let skippedRows = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath, "utf8");
    const rows = parseCsv(content);
    const header = rows.shift();

    if (!header || header.join(",") !== EXPECTED_FIELDS.join(",")) {
      throw new Error(
        `Unexpected columns in ${path.basename(file.fullPath)}: ${header}`
      );
    }

    for (const values of rows) {
      totalRows += 1;

      const row = {};
      EXPECTED_FIELDS.forEach((field, index) => {
        row[field] = values[index] ?? "";
      });

      const providerId = resolveProviderId(
        providers,
        row.provider_code,
        row.provider_ukprn
      );
      if (!providerId) {
        missingProviders.add(
          [normalizeKey(row.provider_code), normalizeKey(row.provider_ukprn)]
            .filter(Boolean)
            .join("|") || "(blank)"
        );
        skippedRows += 1;
        continue;
      }

      const schoolUrn = normalizeKey(row.school_urn);
      const schoolId = schoolsByUrn.get(schoolUrn);
      if (!schoolId) {
        missingSchools.add(schoolUrn || "(blank)");
        skippedRows += 1;
        continue;
      }

      const academicYearCode = normalizeKey(row.start_academic_year);
      const academicYearId = academicYearsByCode.get(academicYearCode);
      if (!academicYearId) {
        missingYears.add(academicYearCode || "(blank)");
        skippedRows += 1;
        continue;
      }

      const subjectKey = normalizeSubject(row.subject_name);
      const subjectId = subjectsByCode.get(subjectKey);
      if (!subjectId) {
        missingSubjects.add(normalizeKey(row.subject_name) || "(blank)");
        skippedRows += 1;
        continue;
      }

      const partnerId = resolvePartnerId(providers, row.partner_reference);
      if (normalizeKey(row.partner_reference) && !partnerId) {
        missingPartners.add(normalizeKey(row.partner_reference));
        skippedRows += 1;
        continue;
      }

      outputRows.push([
        providerId,
        partnerId,
        schoolId,
        academicYearId,
        subjectId,
      ]);
    }
  }

  const outputPath = resolveOutputPath(distDir, "seed-placement-schools.csv");
  fs.writeFileSync(outputPath, writeCsv(outputRows), "utf8");

  console.log(
    `Wrote ${outputRows.length - 1} rows from ${files.length} files to ${outputPath}`
  );
  if (skippedRows > 0) {
    console.warn(`Skipped ${skippedRows} rows due to missing lookups.`);
  }

  const logMissing = (label, set) => {
    if (set.size === 0) return;
    const sample = Array.from(set).slice(0, 20).join(", ");
    console.warn(`${label} (${set.size}): ${sample}`);
  };

  logMissing("Missing providers", missingProviders);
  logMissing("Missing partners", missingPartners);
  logMissing("Missing schools", missingSchools);
  logMissing("Missing academic years", missingYears);
  logMissing("Missing subjects", missingSubjects);

  const missingOutputPath = resolveMissingOutputPath(outputPath);
  const missingRows = [["category", "value"]];
  const pushMissing = (category, set) => {
    Array.from(set)
      .sort()
      .forEach((value) => {
        missingRows.push([category, value]);
      });
  };

  pushMissing("provider", missingProviders);
  pushMissing("partner", missingPartners);
  pushMissing("school", missingSchools);
  pushMissing("academicYear", missingYears);
  pushMissing("subject", missingSubjects);

  fs.writeFileSync(missingOutputPath, writeCsv(missingRows), "utf8");
  console.log(`Wrote missing-items report to ${missingOutputPath}`);
}

main();
