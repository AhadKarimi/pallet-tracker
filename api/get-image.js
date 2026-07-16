const https = require('https');

// استفاده از سرویس پراکسی عمومی که هدرها را به طور کامل شبیه‌سازی می‌کند
function fetchPageViaProxy(targetUrl) {
    return new Promise((resolve, reject) => {
        // استفاده از پراکسی AllOrigins که معمولاً فایروال‌ها را به دلیل کش و توزیع آی‌پی دور می‌زند
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

        https.get(proxyUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed.contents); // محتوای HTML صفحه اصلی والمارت
                } catch (e) {
                    reject(new Error('خطا در پارس کردن پاسخ پراکسی'));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

module.exports = async (req, res) => {
    const pageUrl = req.query.pageUrl;

    if (!pageUrl) {
        return res.status(400).send('آدرس صفحه والمارت ارسال نشده است.');
    }

    try {
        // ۱. دریافت کدهای صفحه از طریق پراکسی واسطه
        const html = await fetchPageViaProxy(pageUrl);

        if (!html) {
            return res.status(500).send('پراکسی موفق به دریافت صفحه نشد.');
        }

        // ۲. پیدا کردن لینک عکس با ریجکس
        const imageRegex = /https:\/\/i5\.walmartimages\.(ca|com)\/images\/[^\s"']+/g;
        const matches = html.match(imageRegex);

        if (!matches || matches.length === 0) {
            return res.status(404).send('عکسی پیدا نشد. احتمالاً صفحه کپچا داده است.');
        }

        let foundImageUrl = matches[0].replace(/&quot;/g, '').replace(/\\/g, '');

        // ۳. دانلود و تحویل عکس با هدر رفرنس فرعی
        const imgOptions = {
            headers: {
                'Referer': 'https://www.walmart.ca/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        https.get(foundImageUrl, imgOptions, (imgRes) => {
            res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            imgRes.pipe(res);
        }).on('error', (e) => {
            res.status(500).send('خطا در لود نهایی عکس: ' + e.message);
        });

    } catch (error) {
        res.status(500).send('خطای فایروال: ' + error.message);
    }
};
