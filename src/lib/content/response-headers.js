export function machineTextHeaders({
	contentType = 'text/plain; charset=utf-8',
	canonical = null,
	noindex = false
} = {}) {
	/** @type {Record<string, string>} */
	const headers = {
		'Cache-Control': 'public, max-age=3600',
		'Content-Language': 'en',
		'Content-Type': contentType,
		'X-Content-Type-Options': 'nosniff'
	};
	if (canonical) headers.Link = `<${canonical}>; rel="canonical"`;
	if (noindex) headers['X-Robots-Tag'] = 'noindex, follow';
	return headers;
}
