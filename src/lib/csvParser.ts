// ============================================================================
// URL Lens - CSV Parser (Browser-Only)
// Parses CSV files containing URLs without uploading to server
// ============================================================================

import { CSVParseResult } from '@/types/audit';

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse CSV content and extract valid URLs
 * Supports various formats: single column, multiple columns, different delimiters
 */
export function parseCSV(content: string): CSVParseResult {
  const urls: string[] = [];
  const invalidLines: string[] = [];
  const seenUrls = new Set<string>();
  let duplicatesRemoved = 0;

  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedContent.split('\n');

  // Try to detect the delimiter
  const delimiter = detectDelimiter(content);

  // Skip header row if it looks like a header
  let startIndex = 0;
  if (lines.length > 0 && isHeaderRow(lines[0])) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      continue;
    }

    // Try to extract URL from the line
    const extractedUrl = extractUrlFromLine(line, delimiter);

    if (extractedUrl) {
      const normalizedUrl = normalizeUrl(extractedUrl);

      if (normalizedUrl) {
        if (seenUrls.has(normalizedUrl)) {
          duplicatesRemoved++;
        } else {
          seenUrls.add(normalizedUrl);
          urls.push(normalizedUrl);
        }
      } else {
        invalidLines.push(line);
      }
    } else {
      invalidLines.push(line);
    }
  }

  return {
    urls,
    invalidLines,
    duplicatesRemoved,
  };
}

/**
 * Detect the delimiter used in CSV content
 */
function detectDelimiter(content: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLines = content.split('\n').slice(0, 5);

  let bestDelimiter = ',';
  let maxCount = 0;

  for (const delimiter of delimiters) {
    let totalCount = 0;
    let consistent = true;
    let prevCount = -1;

    for (const line of firstLines) {
      if (!line.trim()) continue;

      const count = (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      totalCount += count;

      if (prevCount >= 0 && count !== prevCount) {
        consistent = false;
      }
      prevCount = count;
    }

    if (totalCount > maxCount && consistent) {
      maxCount = totalCount;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Check if a line looks like a header row
 */
function isHeaderRow(line: string): boolean {
  const lowerLine = line.toLowerCase();
  const headerKeywords = ['url', 'link', 'website', 'address', 'domain', 'page'];

  return headerKeywords.some((keyword) => lowerLine.includes(keyword));
}

/**
 * Extract URL from a CSV line
 */
function extractUrlFromLine(line: string, delimiter: string): string | null {
  // If the line itself looks like a URL, return it
  if (looksLikeUrl(line)) {
    return cleanUrl(line);
  }

  // Split by delimiter and find URL column
  const columns = parseCSVLine(line, delimiter);

  for (const column of columns) {
    const trimmed = column.trim();
    if (looksLikeUrl(trimmed)) {
      return cleanUrl(trimmed);
    }
  }

  return null;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current);
  return result;
}

/**
 * Check if a string looks like a URL
 */
function looksLikeUrl(str: string): boolean {
  const trimmed = str.trim();

  // Check for common URL patterns
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  // Check for domain-like patterns (e.g., example.com, www.example.com)
  const domainPattern = /^(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/.*)?$/;
  return domainPattern.test(trimmed);
}

/**
 * Clean and prepare a URL string
 */
function cleanUrl(url: string): string {
  let cleaned = url.trim();

  // Remove surrounding quotes
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }

  // Remove any leading/trailing whitespace that might have been inside quotes
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Normalize and validate a URL
 */
function normalizeUrl(url: string): string | null {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  try {
    // Validate URL
    const parsed = new URL(normalized);

    // Only accept http/https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

// ============================================================================
// File Reading (Browser-Only)
// ============================================================================

/**
 * Read a CSV file from a File object
 * This runs entirely in the browser - no server upload
 */
export function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
    const validExtensions = ['.csv', '.txt'];

    const hasValidType = validTypes.includes(file.type) || file.type === '';
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      reject(new Error('Invalid file type. Please upload a CSV or TXT file.'));
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      reject(new Error('File too large. Maximum size is 5MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file content.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse a CSV file directly from File object
 */
export async function parseCSVFile(file: File): Promise<CSVParseResult> {
  const content = await readCSVFile(file);
  return parseCSV(content);
}

// ============================================================================
// URL List Parsing
// ============================================================================

/**
 * Parse a list of URLs from various formats
 * Supports comma-separated, newline-separated, and space-separated
 */
export function parseURLList(input: string): CSVParseResult {
  const urls: string[] = [];
  const invalidLines: string[] = [];
  const seenUrls = new Set<string>();
  let duplicatesRemoved = 0;

  // Normalize and split by common delimiters
  const normalized = input
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Split by newlines, commas, or multiple spaces
  const items = normalized.split(/[\n,]+/).map((item) => item.trim());

  for (const item of items) {
    if (!item) continue;

    // Handle space-separated URLs on the same line
    const subItems = item.includes('http') && item.includes(' ')
      ? item.split(/\s+/)
      : [item];

    for (const subItem of subItems) {
      const trimmed = subItem.trim();
      if (!trimmed) continue;

      const normalizedUrl = normalizeUrl(trimmed);

      if (normalizedUrl) {
        if (seenUrls.has(normalizedUrl)) {
          duplicatesRemoved++;
        } else {
          seenUrls.add(normalizedUrl);
          urls.push(normalizedUrl);
        }
      } else if (looksLikeUrl(trimmed)) {
        // Looks like a URL but invalid
        invalidLines.push(trimmed);
      }
      // Ignore items that don't look like URLs at all
    }
  }

  return {
    urls,
    invalidLines,
    duplicatesRemoved,
  };
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Convert audit results to CSV format
 */
export function resultsToCSV<T extends Record<string, unknown>>(
  results: T[],
  columns: { key: keyof T; header: string }[]
): string {
  const headers = columns.map((col) => escapeCSVField(col.header));
  const rows = results.map((result) =>
    columns.map((col) => escapeCSVField(String(result[col.key] ?? '')))
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Escape a field for CSV format
 */
function escapeCSVField(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Trigger a CSV download in the browser
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger a JSON download in the browser
 */
export function downloadJSON(data: unknown, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
