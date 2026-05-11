'use strict';

const { execFileSync } = require('child_process');

/**
 * Fetch OpenInsider HTML over plain HTTP (works when outbound HTTPS :443 is blocked).
 * OPENINSIDER_CURL_IPV4=1 → curl --ipv4
 * @param {string} url
 * @returns {string}
 */
function curlFetchHtml(url) {
  const args = ['-L', '--max-time', '120', '-sS', url];
  if (process.env.OPENINSIDER_CURL_IPV4 === '1') {
    args.splice(1, 0, '--ipv4');
  }
  return execFileSync('curl', args, {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
}

module.exports = { curlFetchHtml };
