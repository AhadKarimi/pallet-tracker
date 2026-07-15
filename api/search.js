const axios=require('axios');
const cheerio=require('cheerio');
module.exports=async(req,res)=>{
try{
const html=(await axios.get('https://www.walmart.ca/en/search?q='+req.query.barcode)).data;
const $=cheerio.load(html);
res.json({
title:$('a[link-identifier] span').first().text().trim(),
image:$('img').first().attr('src')||''
});
}catch(e){res.status(500).json({error:e.message});}
};
