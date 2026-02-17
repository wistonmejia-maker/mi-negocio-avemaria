// Diagnostic endpoint for Vercel
export default function handler(req, res) {
    res.status(200).json({
        success: true,
        message: 'Vercel Serverless Function is working',
        env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
    });
}
