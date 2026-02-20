/** @type {import('next').NextConfig} */
module.exports = {
	async rewrites() {
		return [
			// Route admin traffic through the edge check-access handler
			{ source: '/admin/:path*', destination: '/api/check-access/admin/:path*' },
		];
	},
};
