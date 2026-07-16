const https = require('https');

// تابع کمکی برای ارسال درخواست‌های HTTP به همراه هدرهای شبیه‌ساز مرورگر واقعی
function fetchPage(urlAddress) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        };

        https.get(urlAddress, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }));
        }).on('error', (err) => reject(err));
    });
}

module.exports = async (req, res) => {
    const pageUrl = req.query.pageUrl;

    if (!pageUrl) {
        return res.status(400).send('آدرس صفحه والمارت ارسال نشده است.');
    }

    try {
        // ۱. دانلود محتوای متنی صفحه سرچ والمارت
        const pageData = await fetchPage(pageUrl);
        
        if (pageData.statusCode !== 200) {
            return res.status(pageData.statusCode).send('کد خطا از سمت والمارت: ' + pageData.statusCode + ' (ربات تشخیص داده شد)');
        }

        const html = pageData.body;

        // ۲. پیدا کردن لینک عکس با استفاده از ریجکس (Regex) در سورس صفحه
        // عکس‌های والمارت معمولا در دامنه‌ی walmartimages.com یا walmartimages.ca هستند
        const imageRegex = /https:\/\/i5\.walmartimages\.(ca|com)\/images\/[^\s"']+/g;
        const matches = html.match(imageRegex);

        if (!matches || matches.length === 0) {
            return res.status(404).send('هیچ عکسی برای این محصول در این صفحه یافت نشد. ممکن است صفحه با کپچا مسدود شده باشد.');
        }

        // تمیز کردن لینک عکس پیدا شده (حذف کاراکترهای اضافه احتمالاً چسبیده به ته لینک)
        let foundImageUrl = matches[0].replace(/&quot;/g, '').replace(/\\/g, '');

        // ۳. حالا دانلود عکس اصلی با هدر Referer و فرستادن آن به کاربر
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
            res.status(500).send('خطا در بارگیری نهایی عکس: ' + e.message);
        });

    } catch (error) {
        res.status(500).send('خطای سرور: ' + error.message);
    }
};
