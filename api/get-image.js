const https = require('https');

module.exports = (req, res) => {
    const targetImgUrl = req.query.img;

    if (!targetImgUrl) {
        return res.status(400).send('لینک تصویر فرستاده نشده است.');
    }

    const options = {
        headers: {
            'Referer': 'https://www.walmart.ca/', // ارسال هدر فیک برای دور زدن فایروال
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    };

    https.get(targetImgUrl, options, (proxyRes) => {
        // کپی کردن هدرهای پاسخ سرور والمارت (مثل فرمت عکس) به مرورگر کاربر
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // کش کردن تصویر برای سرعت بیشتر
        
        proxyRes.pipe(res);
    }).on('error', (e) => {
        res.status(500).send('خطا در دریافت تصویر: ' + e.message);
    });
};
